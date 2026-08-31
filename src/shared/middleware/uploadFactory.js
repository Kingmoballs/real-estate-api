const path = require("path");
const multer = require("multer");
const cloudinary = require(
    "@/shared/utils/cloudinary"
);

const createCloudinaryStorage = ({
    folder,
    allowedFormats,
    transformation,
}) => ({
    _handleFile(req, file, callback) {
        let settled = false;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;

            if (error) {
                callback(error);
                return;
            }

            callback(null, {
                path: result.secure_url || result.url,
                filename: result.public_id,
                size: result.bytes,
                resourceType: result.resource_type,
                format: result.format,
            });
        };

        const uploadOptions = {
            folder,
            allowed_formats: allowedFormats,
            resource_type: "auto",
        };

        if (transformation?.length) {
            uploadOptions.transformation = transformation;
        }

        try {
            const uploadStream =
                cloudinary.uploader.upload_stream(
                    uploadOptions,
                    finish
                );

            file.stream.once("error", finish);
            uploadStream.once("error", finish);
            file.stream.pipe(uploadStream);
        } catch (error) {
            finish(error);
        }
    },

    _removeFile(req, file, callback) {
        if (!file.filename) {
            callback(null);
            return;
        }

        cloudinary.uploader.destroy(
            file.filename,
            {
                resource_type:
                    file.resourceType || "image",
            },
            (error) => callback(error || null)
        );
    },
});

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

    const storage = createCloudinaryStorage({
        folder,
        allowedFormats,
        transformation,
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
