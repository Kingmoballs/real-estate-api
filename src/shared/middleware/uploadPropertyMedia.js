const createUploader = require(
    "./uploadFactory"
);

const uploadPropertyMedia = createUploader({
    folder: "real-estate/properties",

    allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
    ],

    allowedFormats: [
        "jpg",
        "jpeg",
        "png",
        "webp",
    ],

    fileSize: 5 * 1024 * 1024,

    maxFiles: 10,

    transformation: [
        {
            width: 1200,
            height: 800,
            crop: "limit",
            quality: "auto",
        },
    ],
});

module.exports = uploadPropertyMedia;