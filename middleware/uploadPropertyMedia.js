const createUploader = require("./uploadFactory");

const uploadPropertyMedia = createUploader({
    folder: "real-estate/properties",
    allowedMimeTypes: ["image/jpeg", "image/png"],
    allowedFormats: ["jpeg", "png"],
    fileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 10,
    transformation: [{ width: 1200, height: 800, crop: "limit" }]
});

module.exports = uploadPropertyMedia;
