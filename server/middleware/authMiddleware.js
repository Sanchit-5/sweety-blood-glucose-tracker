
const jwt = require("jsonwebtoken");

// Verify user authentication
const authMiddleware = (req, res, next) => {
    try {
        // 1. Get token from request headers
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required. Please log in."
            });
        }

        // 2. Extract token
        const token = authHeader.split(" ")[1];

        // 3. Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 4. Attach user information to request
        req.user = decoded;

        // 5. Continue to the next middleware or route
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
};

module.exports = authMiddleware;
