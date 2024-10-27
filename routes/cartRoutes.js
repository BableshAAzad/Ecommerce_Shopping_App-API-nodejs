import express from 'express';
const router = express.Router();
import CartController from '../controllers/cartController.js';
import checkUserAuth from "../middlewares/auth-middleware.js";

//& Route Level Middleware - To Protect Route
router.post("/customers/:userId/cart-products", checkUserAuth)
router.get("/customers/:userId/cart-products", checkUserAuth)
router.put("/customers/cart-products/:productId", checkUserAuth)

//& Protected Routes
router.post("/customers/:userId/cart-products", CartController.addCartProduct)
router.get("/customers/:userId/cart-products", CartController.getCartProducts)
router.put("/customers/cart-products/:cartProductId", CartController.updateCartProducts)


export default router