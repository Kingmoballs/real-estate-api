const path = require("path");
const multer = require("multer");

const {
    CloudinaryStorage,
} = require("multer-storage-cloudinary");

const cloudinary = require(
    "@/shared/utils/cloudinary"
);

const createUploader = ({
    folder,
    allowedMimeTypes,
    allowedFormats,
    fileSize,
    maxFiles,
    transformation,
}) => {
    const normalizedFormats =
        allowedFormats.map((format) =>
            format.toLowerCase()
        );

    const fileFilter = (req, file, callback) => {
        const mimeType = (
            file.mimetype || ""
        ).toLowerCase();

        const extension = path
            .extname(file.originalname || "")
            .replace(".", "")
            .toLowerCase();

        const hasAllowedMimeType =
            allowedMimeTypes.includes(mimeType);

        const hasGenericMimeType =
            mimeType ===
            "application/octet-stream";

        const hasAllowedExtension =
            normalizedFormats.includes(extension);

        /*
         * Normal clients should send image/jpeg,
         * image/png or image/webp.
         *
         * Some Postman uploads use the generic
         * application/octet-stream MIME type.
         * Permit that only when the filename has
         * an approved image extension.
         */
        const isAllowedGenericUpload =
            hasGenericMimeType &&
            hasAllowedExtension;

        if (
            !hasAllowedMimeType &&
            !isAllowedGenericUpload
        ) {
            return callback(
                new Error(
                    [
                        `Unsupported file "${file.originalname}".`,
                        `Detected MIME type: ${mimeType || "unknown"}.`,
                        `Detected extension: ${extension || "none"}.`,
                        `Allowed formats: ${normalizedFormats.join(", ")}.`,
                    ].join(" ")
                )
            );
        }

        callback(null, true);
    };

    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder,
            allowed_formats: allowedFormats,
            transformation,
            resource_type: "image",
        },
    });

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize,
            files: maxFiles,
        },
    });
};

module.exports = createUploader;