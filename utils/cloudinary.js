const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up CloudinaryStorage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'causes-images', // Create a folder in Cloudinary for organizing uploads
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 800, crop: 'limit' }] // Resize images for optimization
    }
});

// Configure Multer to use Cloudinary storage
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

module.exports = {
    cloudinary,
    upload
}; 