const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/me - Protected route
router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({
        message: "Authentication successful!",
        user: req.user
    });
});

module.exports = router;