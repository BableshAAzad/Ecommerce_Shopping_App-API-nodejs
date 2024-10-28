import CartModel from "../models/cart.js"
import ProductModel from "../models/product.js"

class CartController {
    // ^---------------------------------------------------------------------------------------------------------
    static addCartProduct = async (req, resp) => {
        const userId = req.params.userId;
        if (userId) {
            try {
                const authUserId = req.user.userId.toString();
                if (userId === authUserId) {
                    const { selectedQuantity, product } = req.body;

                    if (!selectedQuantity || !product || !product.productId) {
                        return resp.status(400).send({
                            status: 400,
                            message: "Invalid data: selectedQuantity and product.productId are required",
                        });
                    }

                    // Check if the product already exists in the user's cart
                    const existingCartItem = await CartModel.findOne({ userId, product: product.productId });

                    // Fetch the associated product to check available stocks
                    const productItem = await ProductModel.findById(product.productId);
                    if (!productItem) {
                        return resp.status(400).send({
                            status: 400,
                            message: "Invalid data: Product not found",
                        });
                    }

                    if (existingCartItem) {
                        // Calculate the difference in quantity
                        const previousQuantity = existingCartItem.selectedQuantity;
                        const quantityDifference = selectedQuantity - previousQuantity;

                        // Check if the stock is sufficient for the updated quantity
                        if (productItem.stocks < quantityDifference) {
                            return resp.status(400).send({
                                status: 400,
                                message: "Invalid data: selected quantity exceeds available stocks",
                            });
                        }

                        // Update the cart item with new quantity
                        existingCartItem.selectedQuantity = selectedQuantity;
                        await existingCartItem.save();

                        // Adjust the product stocks based on quantity difference
                        await ProductModel.findByIdAndUpdate(
                            product.productId,
                            { $inc: { stocks: -quantityDifference } }
                        );

                        return resp.status(200).send({
                            status: 200,
                            message: "Cart product quantity updated successfully",
                            data: existingCartItem,
                        });
                    } else {
                        // Check if there's enough stock for a new cart item
                        if (productItem.stocks < selectedQuantity) {
                            return resp.status(400).send({
                                status: 400,
                                message: "Invalid data: selected quantity exceeds available stocks",
                            });
                        }

                        // Create a new cart item
                        const cartItem = new CartModel({
                            userId,
                            selectedQuantity,
                            product: product.productId,
                        });

                        // Save the new cart item and update product stock
                        await cartItem.save();
                        await ProductModel.findByIdAndUpdate(
                            product.productId,
                            { $inc: { stocks: -selectedQuantity } }
                        );

                        resp.status(201).send({
                            status: 201,
                            message: "Product added to cart successfully",
                            data: cartItem,
                        });
                    }
                } else {
                    resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error failed to add cart", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }
    };

    // ^---------------------------------------------------------------------------------------------------------
    static getCartProducts = async (req, resp) => {
        const userId = req.params.userId;
        if (userId) {
            try {
                const authUserId = req.user.userId.toString();
                if (userId === authUserId) {
                    // Find cart products for the specific user
                    let cartProducts = await CartModel.find({ userId })
                        .populate("product") // Populate product details
                        .exec();

                    resp.status(200).send({ status: 200, message: "Cart Products fonded", data: cartProducts });
                } else {
                    resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
                }
            } catch (error) {
                console.error(error);
                resp.status(500).send({ status: 500, message: "Error failed to find cart product", rootCause: error.message });
            }
        } else {
            resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }
    }

    // ^---------------------------------------------------------------------------------------------------------
    static updateCartProducts = async (req, resp) => {
        const userId = req.user.userId.toString();
        const { cartProductId } = req.params;
        const newQuantity = parseInt(req.query.selectedQuantity, 10); // Convert to integer

        if (!newQuantity || isNaN(newQuantity))
            return resp.status(400).send({
                status: 400,
                message: "Invalid data: selectedQuantity is required and must be a number",
            });

        if (!cartProductId)
            return resp.status(400).send({
                status: 400,
                message: "Invalid data: product Id not selected",
            });

        try {
            // Retrieve existing cart item
            const oldCartItem = await CartModel.findById({ _id: cartProductId });
            if (!oldCartItem)
                return resp.status(404).send({
                    status: 404,
                    message: "Cart product not found",
                });

            // Fetch the associated product to check stocks
            const product = await ProductModel.findById(oldCartItem.product);
            if (!product)
                return resp.status(400).send({
                    status: 400,
                    message: "Invalid data: Product not found",
                });

            // Validate selected quantity is not greater than available stocks
            const previousQuantity = oldCartItem.selectedQuantity;
            const quantityDifference = newQuantity - previousQuantity;

            if (product.stocks < quantityDifference) {
                return resp.status(400).send({
                    status: 400,
                    message: "Invalid data: selected quantity exceeds available stocks",
                });
            }

            // Update the cart item with new quantity
            const cartItem = await CartModel.findOneAndUpdate(
                { _id: cartProductId, userId },
                { selectedQuantity: newQuantity },
                { new: true } // Return updated document
            );

            if (cartItem) {
                // Adjust the product stocks based on quantity difference
                const updatedProduct = await ProductModel.findOneAndUpdate(
                    { _id: cartItem.product },
                    { $inc: { stocks: -quantityDifference } }, // Adjust stocks by quantity difference
                    { new: true }
                );

                resp.status(200).send({
                    status: 200,
                    message: "Cart product quantity updated successfully",
                    data: cartItem,
                });
            } else {
                resp.status(404).send({
                    status: 404,
                    message: "Cart product not found",
                });
            }
        } catch (error) {
            console.error(error);
            resp.status(500).send({
                status: 500,
                message: "Error: failed to update cart product",
                rootCause: error.message,
            });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------

    static deleteCartProduct = async (req, resp) => {
        const userId = req.params.userId;
        const cartProductId = req.params.cartProductId;

        if (!userId || !cartProductId) {
            return resp.status(400).send({
                status: 400,
                message: "Invalid Operation: Missing User ID or Cart Product ID",
            });
        }

        try {
            const authUserId = req.user.userId.toString();
            if (userId !== authUserId) {
                return resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
            }

            // Find the cart item to delete
            const cartItem = await CartModel.findOne({ _id: cartProductId, userId });
            if (!cartItem) {
                return resp.status(404).send({
                    status: 404,
                    message: "Cart product not found",
                });
            }

            // Find the associated product to update its stock
            const product = await ProductModel.findById(cartItem.product._id);
            if (!product) {
                return resp.status(400).send({
                    status: 400,
                    message: "Invalid data: Product not found",
                });
            }

            // Restore the product stock based on the cart item quantity
            await ProductModel.findByIdAndUpdate(
                cartItem.product,
                { $inc: { stocks: cartItem.selectedQuantity } }
            );

            // Delete the cart item
            await CartModel.deleteOne({ _id: cartProductId });

            resp.status(200).send({
                status: 200,
                message: "Cart product deleted successfully and stock updated",
            });
        } catch (error) {
            console.error(error);
            resp.status(500).send({
                status: 500,
                message: "Error: Failed to delete cart product",
                rootCause: error.message,
            });
        }
    };
    // ^---------------------------------------------------------------------------------------------------------
    static deleteAllCartProduct = async (req, resp) => {
        const userId = req.params.userId;

        if (!userId) {
            return resp.status(400).send({ status: 400, message: "Illegal Operation: Missing User ID" });
        }

        try {
            const authUserId = req.user.userId.toString();
            if (userId !== authUserId) {
                return resp.status(400).send({ status: 400, message: "Illegal Operation: User ID Mismatch" });
            }

            // Retrieve all cart items for the user
            const cartItems = await CartModel.find({ userId });
            if (!cartItems.length) {
                return resp.status(404).send({ status: 404, message: "No cart products found for the user" });
            }

            // Update stock for each product in the cart
            const bulkProductUpdates = cartItems.map(cartItem => ({
                updateOne: {
                    filter: { _id: cartItem.product },
                    update: { $inc: { stocks: cartItem.selectedQuantity } }
                }
            }));

            // Execute bulk update for stock adjustments
            await ProductModel.bulkWrite(bulkProductUpdates);

            // Delete all cart items for the user
            await CartModel.deleteMany({ userId });

            resp.status(200).send({
                status: 200,
                message: "All cart products deleted successfully, and stocks updated",
            });
        } catch (error) {
            console.error(error);
            resp.status(500).send({
                status: 500,
                message: "Error: Failed to delete all cart products",
                rootCause: error.message,
            });
        }
    };

    // ^---------------------------------------------------------------------------------------------------------

}
export default CartController