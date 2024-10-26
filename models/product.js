import mongoose from "mongoose";

// Defining Schema values (Structure)
const productSchema = new mongoose.Schema({
    productTitle: { type: String, required: true, trim: true },
    lengthInMeters: { type: Number, required: true },
    breadthInMeters: { type: Number, required: true },
    heightInMeters: { type: Number, required: true },
    weightInKg: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, trim: true },
    productImage: { type: String, trim: true },
    materialTypes: [{ type: String, trim: true }],
    restockedAt: { type: Date },
    updatedInventoryAt: { type: Date },
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    stocks: { type: Number, required: true },
    discount: { type: Number, required: true },
    discountType: {
        type: String,
        enum: ["DIWALI", "NEWYEAR", "NEW", "SPECIAL", "PERCENTAGE", "FLAT"],
        required: true
    }
});

// Create collection Model
const ProductModel = mongoose.model("product", productSchema);

export default ProductModel;

