import ProductModel from "../models/product.js"
import cloudinary from 'cloudinary';

//! Configure Cloudinary with credentials
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    // secure: true,
});

class ProductController {
    // ^---------------------------------------------------------------------------------------------------------
    static uploadImage = async (req, res) => {
        try {
            // Ensure a file is uploaded
            // console.log("=--------------------------")
            // console.log(req.file)
            // console.log("+++++++++++++++++++++++++++++++++")
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
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'ecommerce-shopping-app',
            });
            let product = new ProductModel({
                sellerId: sellerId,
                productTitle: productTitle,
                lengthInMeters: lengthInMeters,
                breadthInMeters: breadthInMeters,
                heightInMeters: heightInMeters,
                weightInKg: weightInKg,
                price: price,
                description: description,
                productImage: result.secure_url,
                materialTypes: materialTypes,
                discountType: discountType,
                discount: discount,
                stocks: stocks,
                restockedAt: new Date().setHours(0, 0, 0, 0)
            })
            await product.save();
            resp.status(201).send({ "status": 201, "message": "Product added", "data": "product added successfully" })
        } catch (error) {
            console.log(error)
            resp.status(500).send({ "status": "failed", "message": "Unable to add product" })
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
}

export default ProductController