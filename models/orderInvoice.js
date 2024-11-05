import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const orderInvoiceSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "order" },
    pdfData: {
        type: Buffer, // Storing binary data like a byte array
        required: true
    }
})

//& Create collections of Model
const OrderInvoiceModel = mongoose.model("orderInvoice", orderInvoiceSchema)

export default OrderInvoiceModel