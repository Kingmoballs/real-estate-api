const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "real-estate-properties", // folder in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 1200, height: 800, crop: "limit" }],
    },
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };
