import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    selectedQuantity: { type: Number, require: true },
    product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "product" }
})

//& Create collections of Model
const CartModel = mongoose.model("cart", cartSchema)

export default CartModel