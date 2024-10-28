import ProductModel from "../models/product.js"
import cloudinary from 'cloudinary';

class ProductController {
    // ^---------------------------------------------------------------------------------------------------------
    static uploadImage = async (req, res) => {
        try {
            // Ensure a file is uploaded
            // console.log(req.file)
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'ecommerce-shopping-app',
            });
            res.status(200).json({ imageUrl: result.secure_url });
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static addProduct = async (req, resp) => {
        try {
            let { sellerId,
                productTitle,
                lengthInMeters,
                breadthInMeters,
                heightInMeters,
                weightInKg,
                price,
                description,
                materialTypes,
                discountType,
                discount,
                stocks } = req.body

            // & save image
            let productImageUrl = "";
            if (req.file && req.file.path) {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'ecommerce-shopping-app',
                });
                productImageUrl = result.secure_url; // Set image URL after upload
            }

            let product = new ProductModel({
                sellerId: sellerId,
                productTitle: productTitle,
                lengthInMeters: lengthInMeters,
                breadthInMeters: breadthInMeters,
                heightInMeters: heightInMeters,
                weightInKg: weightInKg,
                price: price,
                description: description,
                productImage: productImageUrl,
                materialTypes: materialTypes,
                discountType: discountType,
                discount: discount,
                stocks: stocks,
                restockedAt: new Date().toISOString().split('T')[0]
            })
            await product.save();
            resp.status(201).send({ "status": 201, "message": "Product added", "data": "product added successfully" })
        } catch (error) {
            console.log(error)
            resp.status(500).send({ "status": 500, "message": "Unable to add product" })
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getProducts = async (req, resp) => {
        // Default to page 0 and size 10 if not provided
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;

        const totalItems = await ProductModel.countDocuments(); // Get total item count
        const products = await ProductModel.find()
            .skip(page * size)
            .limit(size);
        const data = {
            content: products,
            page: {
                totalElements: totalItems,
                totalPages: Math.ceil(totalItems / size),
                currentPage: page,
            }
        };
        resp.status(200).send({ status: 200, "message": "Products are founded", data })
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getProductsBySeller = async (req, resp) => {
        const userId = req.params.userId;
        if (userId) {
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            try {
                // Get total count of products for the specific seller
                const totalItems = await ProductModel.countDocuments({ sellerId: userId });

                // Fetch products based on sellerId with pagination
                const products = await ProductModel.find({ sellerId: userId })
                    .skip(page * size)
                    .limit(size);

                const data = {
                    content: products,
                    page: {
                        totalElements: totalItems,
                        totalPages: Math.ceil(totalItems / size),
                        currentPage: page,
                    }
                };
                resp.status(200).send({ status: 200, message: "Products found for seller", data });
            } catch (error) {
                console.log(error)
                resp.status(500).send({ status: 500, message: "Error fetching products", error: error.message });
            }
        } else {
            resp.status(500).send({ status: 500, message: "Illegal Operation: Missing Seller ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static getProduct = async (req, resp) => {
        const _id = req.params.productId;
        if (_id) {
            try {
                // Fetch the product by its ID directly
                let product = await ProductModel.findById(_id);
                if (product) {
                    resp.status(200).send({ status: 200, message: "Product found", data: product });
                } else {
                    resp.status(404).send({ status: 404, message: "Product not found" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error fetching product", error: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing product ID" });
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static updateProduct = async (req, resp) => {
        const _id = req.params.productId;
        if (_id) {
            try {
                // Fetch the product by its ID directly
                let product = await ProductModel.findById(_id);
                if (product) {
                    // Update product fields with the request body, skipping undefined fields
                    Object.keys(req.body).forEach(key => {
                        if (key !== "productImage" && req.body[key] !== undefined) { // Avoid undefined values
                            product[key] = req.body[key];
                        }
                    });
                    // Check if a new image file is uploaded
                    if (req.file && req.file.path !== product.productImage) {
                        // Upload the new image to Cloudinary
                        const result = await cloudinary.v2.uploader.upload(req.file.path, {
                            folder: 'ecommerce-shopping-app',
                        });
                        product.productImage = result.secure_url; // Update productImage with new URL
                    }
                    product.updatedInventoryAt = new Date().toISOString().split('T')[0]
                    // Save the updated product back to the database
                    await product.save();
                    resp.status(200).send({ status: 200, message: "Product updated successfully", product });
                } else {
                    resp.status(404).send({ status: 404, message: "Product not found" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error updating product", error: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing product ID" });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------
    static searchProducts = async (req, resp) => {
        const query = req.params.query;
        if (query) {
            try {
                // Default to page 0 and size 10 if not provided in query
                const page = parseInt(req.query.page) || 0;
                const size = parseInt(req.query.size) || 10;
                // Construct a dynamic search condition to look for products that match the query
                const searchCondition = {
                    $or: [
                        { productTitle: { $regex: query, $options: "i" } },   // Case-insensitive search on product title
                        { description: { $regex: query, $options: "i" } },    // Case-insensitive search on description
                        { materialTypes: { $regex: query, $options: "i" } },  // Case-insensitive search in material types
                        { discountType: { $regex: query, $options: "i" } }    // Case-insensitive search in discount type
                    ],
                    // Handle exact matches for price if the query can be converted to a number
                    ...(parseFloat(query) ? { price: parseFloat(query) } : {})
                };
                // Find products matching the search condition with pagination
                const products = await ProductModel.find(searchCondition)
                    .skip(page * size)   // Skip items based on the current page
                    .limit(size);        // Limit results to the page size
                // Count total documents that match the query for pagination metadata
                const totalResults = await ProductModel.countDocuments(searchCondition);
                // Send response with products and pagination info
                const data = {
                    content: products,
                    page: {
                        totalElements: totalResults,
                        totalPages: Math.ceil(totalResults / size),
                        currentPage: page,
                    }
                };
                resp.status(200).send({ status: 200, message: "Products fetched successfully", data });
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error fetching products", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing product search query" });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------

    static filterProducts = async (req, resp) => {
        // Default to page 0 and size 10 if not provided
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 10;
    
        let { productTitle, minPrice, maxPrice, description, sortOrder, materialTypes } = req.body;
        //! console.log(req.body)
    
        // Initialize filter criteria
        const filterCriteria = {};
    
        // Build filter criteria based on the provided inputs
        if (productTitle) {
            filterCriteria.productTitle = { $regex: new RegExp(productTitle, 'i') }; // Case-insensitive search
        }
    
        // Convert minPrice and maxPrice to numbers and check for valid values
        if (minPrice !== undefined && minPrice !== '') {
            const min = parseFloat(minPrice);
            if (!isNaN(min)) {
                filterCriteria.price = { ...filterCriteria.price, $gte: min };
            }
        }
    
        if (maxPrice !== undefined && maxPrice !== '') {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
                filterCriteria.price = { ...filterCriteria.price, $lte: max };
            }
        }
    
        if (description) {
            filterCriteria.description = { $regex: new RegExp(description, 'i') }; // Case-insensitive search
        }
    
        if (Array.isArray(materialTypes) && materialTypes.length > 0) {
            filterCriteria.materialTypes = { $in: materialTypes }; // Filter for material types
        }
    
        //! console.log("Filter Criteria:", filterCriteria); // Debugging line
    
        try {
            // Get total items count based on the filter criteria
            const totalItems = await ProductModel.countDocuments(filterCriteria);
            //! console.log("Total Items:", totalItems); // Debugging line
    
            // Fetch products with pagination and filtering
            const products = await ProductModel.find(filterCriteria)
                .skip(page * size)
                .limit(size)
                .sort(sortOrder ? { price: sortOrder === 'asc' ? 1 : -1 } : {});
    
            const data = {
                content: products,
                page: {
                    totalElements: totalItems,
                    totalPages: Math.ceil(totalItems / size),
                    currentPage: page,
                }
            };
    
            resp.status(200).send({ status: 200, message: "Products found", data });
        } catch (error) {
            console.error(error);
            resp.status(500).send({ status: 500, message: "Error filtering products", rootCause: error.message });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------


}

export default ProductController