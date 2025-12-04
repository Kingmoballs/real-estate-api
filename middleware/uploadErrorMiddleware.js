module.exports = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle Multer-specific errors
        return res. status(400).json({ message: err.message });
    }

    if (err) {
        // Handle other errors
        return res.status(400).json({ message: err.message })
    }

    next();
}