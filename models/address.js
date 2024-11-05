import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const addressSchema = new mongoose.Schema({
    streetAddress: { type: String, required: true, trim: true },
    streetAddressAdditional: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: Number, require: true },
    addressType: {
        type: String,
        enum: ["OFFICE", "SHOP", "HOME", "INDUSTRY", "OTHER"],
        required: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "contact" }]
})

//& Create collections of Model
const AddressModel = mongoose.model("address", addressSchema)

export default AddressModel