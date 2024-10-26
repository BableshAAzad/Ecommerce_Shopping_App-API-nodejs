import mongoose from "mongoose";

//^ Defining Schema values(Structure)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    termAndCondition: { type: Boolean, required: true },
    userRole: { type: String, required: true, trim: true },
    isDeleted: { type: Boolean, require: true }
})

//& Create collections of Model
const UserModel = mongoose.model("user", userSchema)

export default UserModel