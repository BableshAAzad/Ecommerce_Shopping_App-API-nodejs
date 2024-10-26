import mongoose from "mongoose";

//^ Defining Schema values (Structure)
const productSchema = new mongoose.Schema({
    productTitle: { type: String, required: true, trim: true },
    productDescription: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true },
    productQuantity: { type: Number, required: true },
    availabilityStatus: { type: Boolean, required: true },
    discount: { type: Number, required: true },
    image: { type: String, required: true, trim: true }
})

//& Create collection Model
const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;
