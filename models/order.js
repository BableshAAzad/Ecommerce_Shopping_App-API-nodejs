import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const orderSchema = new mongoose.Schema({
    totalQuantity: { type: Number, require: true },
    totalPrice: { type: Number, require: true },
    discount: { type: Number, require: true },
    discountPrice: { type: Number, require: true },
    totalPayableAmount: { type: Number, require: true },
    invoiceDate: {type: Date, require: true},
    product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "product" },
    address: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "address" },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" }
})

//& Create collections of Model
const OrderModel = mongoose.model("order", orderSchema)

export default OrderModel