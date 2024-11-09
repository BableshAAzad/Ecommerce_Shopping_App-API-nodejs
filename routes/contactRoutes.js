import express from 'express';
const router = express.Router();
import ContactController from '../controllers/contactController.js';
import checkUserAuth from "../middlewares/auth-middleware.js";

//& Route Level Middleware - To Protect Route
router.post("/addresses/:addressId/contacts", checkUserAuth)
router.get("/addresses/:addressId/contacts", checkUserAuth)
router.put("/addresses/:addressId/contacts/:contactId", checkUserAuth)

//& Protected Routes
router.post("/addresses/:addressId/contacts", ContactController.addContact)
router.get("/addresses/:addressId/addresses", ContactController.getContact)
router.put("/addresses/:addressId/contacts/:contactId", ContactController.updateContact)

export default router