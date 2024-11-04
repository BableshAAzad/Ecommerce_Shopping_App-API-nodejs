import express from 'express';
const router = express.Router();
import ProductController from '../controllers/productController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import checkUserAuth from "../middlewares/auth-middleware.js";


//! Configure Cloudinary with credentials
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // secure: true,
});

// Configure multer with Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'ecommerce-shopping-app', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed formats
  },
});
const upload = multer({ storage });

//& Route Level Middleware - To Protect Route
router.post("/products", checkUserAuth)
router.get("/sellers/:userId/products", checkUserAuth)
router.put("/sellers/products/:productId", checkUserAuth)
router.get("/sellers/products/dashboard", checkUserAuth)

//& Protected Routes
router.post("/upload-images", upload.single('image'), ProductController.uploadImage)
router.post("/products", upload.single('productImage'), ProductController.addProduct)
router.get("/products", ProductController.getProducts)
router.get("/products/:productId", ProductController.getProduct)
router.get("/sellers/:userId/products", ProductController.getProductsBySeller)
router.put("/sellers/products/:productId", upload.single('productImage'), ProductController.updateProduct)
router.get("/products/search/:query", ProductController.searchProducts)
router.post("/products/filter", ProductController.filterProducts)
router.get("/sellers/products/dashboard", ProductController.productsDashboard)

export default router


