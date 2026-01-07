const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const createUploader = ({
    folder,
    allowedMimeTypes,
    allowedFormats,
    fileSize,
    maxFiles,
    transformation
}) => {
    const fileFilter = (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new Error(`Invalid file type. Allowed: ${allowedFormats.join(", ")}`)
            );
        }
        cb(null, true);
    };

    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder,
            allowed_formats: allowedFormats,
            transformation
        },
    });

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize,
            files: maxFiles
        }
    });
};

module.exports = createUploader;
