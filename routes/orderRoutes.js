import express from 'express';
const router = express.Router();
import checkUserAuth from "../middlewares/auth-middleware.js";
import OrderController from '../controllers/orderController.js';

//& Route Level Middleware - To Protect Route
router.post("/customers/:userId/addresses/:addressId/products/:productId/purchase-orders", checkUserAuth)
router.get("/customers/:userId/purchase-orders", checkUserAuth)
router.get('/customers/purchase-orders/invoice/:orderId', checkUserAuth);

//& Protected Routes
router.post("/customers/:userId/addresses/:addressId/products/:productId/purchase-orders", OrderController.addOrder)
router.get("/customers/:userId/purchase-orders", OrderController.getOrders)
router.get('/customers/purchase-orders/invoice/:orderId', OrderController.getInvoice);

export default router