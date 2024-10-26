import express from 'express';
const router = express.Router();
import ProductController from '../controllers/productController.js';
import multer from 'multer';


// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Temporary storage location

router.post("/upload-images", upload.single('image'), ProductController.uploadImage)

export default router


