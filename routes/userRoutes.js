import express from 'express';
const router = express.Router();
import UserController from '../controllers/userController.js';
// const userController = require('./controllers/userController');
import checkUserAuth from "../middlewares/auth-middleware.js"
import logout from '../middlewares/logout-middleware.js';
import refreshLogin from "../middlewares/refresh-middleware.js"

//& Route Level Middleware - To Protect Route
router.get('/users/:userId', checkUserAuth)
router.use("/logout", logout)

//& Protected Routes
router.get('/users/:userId', UserController.loggedUser)
router.post("/refresh-login", refreshLogin)

//* Public Routes
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
router.post("/login", UserController.userLogin)
router.post("/users/resend-otp", UserController.resendOtp)
router.put("/users/update/:email", UserController.forgetPassword)

export default router

