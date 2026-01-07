/**const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Multer filters
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"]; 

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Invalid file type. Only Jpg, Jpeg and Png are allowed."));
    }
    cb(null, true);
}

// Storage configuration
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "real-estate-properties", // folder in Cloudinary
        allowed_formats: ["jpeg", "png"],
        transformation: [{ width: 1200, height: 800, crop: "limit" }],
    },
});

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, //2MB limit
        files: 10 //max 5 files per upload
    }
});

module.exports = { upload, cloudinary };
**/