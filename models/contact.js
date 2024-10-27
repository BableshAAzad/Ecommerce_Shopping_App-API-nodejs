import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const contactSchema = new mongoose.Schema({
    contactNumber: { type: Number, require: true },
    priority: {
        type: String,
        enum: ["PRIMARY", "SECONDARY"],
        required: true
    }
})

//& Create collections of Model
const ContactModel = mongoose.model("contact", contactSchema)

export default ContactModel