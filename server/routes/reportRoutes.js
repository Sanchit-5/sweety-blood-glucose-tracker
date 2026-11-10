
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getDailyReport,
    getMonthToDateReport,
    getPreviousMonthReport
} = require("../controllers/reportController");

const router = express.Router();

// GET /api/reports/daily?date=2026-11-09
router.get("/daily", authMiddleware, getDailyReport);

// GET /api/reports/month-to-date?date=2026-11-09
router.get("/month-to-date", authMiddleware, getMonthToDateReport);

// GET /api/reports/previous-month?date=2026-11-09
router.get("/previous-month", authMiddleware, getPreviousMonthReport);

module.exports = router;
