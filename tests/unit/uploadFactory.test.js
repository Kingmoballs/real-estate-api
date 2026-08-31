const { PassThrough } = require("stream");

jest.mock("@/shared/utils/cloudinary", () => ({
    uploader: {
        upload_stream: jest.fn(),
        destroy: jest.fn(),
    },
}));

const cloudinary = require(
    "../../src/shared/utils/cloudinary"
);
const createUploader = require(
    "../../src/shared/middleware/uploadFactory"
);

describe("Cloudinary upload storage", () => {
    test("streams files and preserves the existing file metadata contract", async () => {
        cloudinary.uploader.upload_stream.mockImplementation(
            (options, callback) => {
                const destination = new PassThrough();
                destination.resume();
                destination.on("finish", () => {
                    callback(null, {
                        secure_url: "https://example.com/image.jpg",
                        public_id: "properties/image-id",
                        bytes: 4,
                        resource_type: "image",
                        format: "jpg",
                    });
                });
                return destination;
            }
        );

        const uploader = createUploader({
            folder: "properties",
            allowedMimeTypes: ["image/jpeg"],
            allowedFormats: ["jpg", "jpeg"],
            fileSize: 1024,
            maxFiles: 1,
            transformation: [{ width: 1200 }],
        });
        const source = new PassThrough();

        const uploadedFile = await new Promise((resolve, reject) => {
            uploader.storage._handleFile(
                {},
                {
                    originalname: "image.jpg",
                    mimetype: "image/jpeg",
                    stream: source,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            source.end(Buffer.from("test"));
        });

        expect(
            cloudinary.uploader.upload_stream
        ).toHaveBeenCalledWith(
            {
                folder: "properties",
                allowed_formats: ["jpg", "jpeg"],
                resource_type: "auto",
                transformation: [{ width: 1200 }],
            },
            expect.any(Function)
        );
        expect(uploadedFile).toEqual({
            path: "https://example.com/image.jpg",
            filename: "properties/image-id",
            size: 4,
            resourceType: "image",
            format: "jpg",
        });
    });
});
