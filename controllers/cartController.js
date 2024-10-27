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
                    // Destructure and validate required fields from req.body
                    const { selectedQuantity, product } = req.body;

                    if (!selectedQuantity || !product || !product.productId) {
                        return resp.status(400).send({
                            status: 400,
                            message: "Invalid data: selectedQuantity and product.productId are required",
                        });
                    }
                    // Create a new cart item
                    const cartItem = new CartModel({
                        userId,
                        selectedQuantity,
                        product: product.productId // only store the productId as a reference
                    });
                    // Save the cart item
                    await cartItem.save();
                    resp.status(201).send({ status: 201, message: "Product added to cart successfully", data: cartItem, });
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
    }
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

}

export default CartController