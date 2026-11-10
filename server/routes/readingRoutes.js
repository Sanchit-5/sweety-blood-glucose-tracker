
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    createReading,
    getReadings,
    updateReading,
    deleteReading
} = require("../controllers/readingController");

const router = express.Router();

// POST /api/readings
// Protected route: only logged-in users can create readings
router.post("/", authMiddleware, createReading);

router.get("/", authMiddleware, getReadings);

router.put("/:id", authMiddleware, updateReading);

router.delete("/:id", authMiddleware, deleteReading);

module.exports = router;
