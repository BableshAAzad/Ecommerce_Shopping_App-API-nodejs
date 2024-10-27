import express from 'express';
const router = express.Router();
import AddressController from '../controllers/addressController.js';
import checkUserAuth from "../middlewares/auth-middleware.js";

//& Route Level Middleware - To Protect Route
router.post("/users/:userId/addresses", checkUserAuth)
router.get("/users/:userId/addresses", checkUserAuth)
router.put("/users/addresses/:addressId", checkUserAuth)

//& Protected Routes
router.post("/users/:userId/addresses", AddressController.addAddress)
router.get("/users/:userId/addresses", AddressController.getAddresses)
router.put("/users/addresses/:addressId", AddressController.updateAddress)

export default router