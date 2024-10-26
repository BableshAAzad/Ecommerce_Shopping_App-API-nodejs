import express from 'express';
const router = express.Router();
import UserController from '../controllers/userController.js';
//& const userController = require('./controllers/userController');

//& Route Level Middleware - To Protect Route


//& Public Routes
// Custom middleware to add data to req object
const addRollSeller = (req, res, next) => {
    req.addRoll = "SELLER";
    next();
};
const addRollCustomer = (req, res, next) => {
    req.addRoll = "CUSTOMER";
    next();
};
router.post('/sellers/register', addRollSeller, UserController.userRegistration)
router.post('/customers/register', addRollCustomer, UserController.userRegistration)
router.post("/users/otp-verification", UserController.userRegistrationWithOtp)

//& Protected Routes


export default router

