const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((error) => error.message)
            .join(", ");
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid task ID";
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate value already exists";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;