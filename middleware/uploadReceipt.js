const createUploader = require("./uploadFactory");

const uploadReceipt = createUploader({
    folder: "real-estate/receipts",
    allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ],
    allowedFormats: ["jpeg", "png", "pdf"],
    fileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    transformation: [] 
});

module.exports = uploadReceipt;
