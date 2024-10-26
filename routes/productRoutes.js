import express from 'express';
const router = express.Router();
import ProductController from '../controllers/productController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';

// Configure multer with Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
      folder: 'ecommerce-shopping-app', // Folder in Cloudinary
      allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed formats
    },
  });
  const upload = multer({ storage });

router.post("/upload-images", upload.single('image'), ProductController.uploadImage)
router.post("/products",upload.single('productImage'),  ProductController.addProduct)

export default router


