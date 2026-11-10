
const pool = require("../config/db");

// Get daily glucose report
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;

        // Validate date
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "Please provide a valid calendar date."
            });
        }

        // Fetch readings and calculate statistics
        const result = await pool.query(
            `SELECT
                COALESCE(MAX(glucose_value), 0) AS highest,
                COALESCE(MIN(glucose_value), 0) AS lowest,
                COALESCE(ROUND(AVG(glucose_value), 1), 0) AS average,
                COUNT(*) AS count
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2`,
            [req.user.userId, date]
        );

        // Fetch individual readings
        const readingsResult = await pool.query(
            `SELECT
                id,
                reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date = $2
             ORDER BY
                CASE time_slot
                    WHEN 'Morning' THEN 1
                    WHEN 'After breakfast' THEN 2
                    WHEN 'After lunch' THEN 3
                    WHEN 'After dinner' THEN 4
                END`,
            [req.user.userId, date]
        );

        return res.status(200).json({
            message: "Daily report fetched successfully!",
            date,
            summary: {
                highest: Number(result.rows[0].highest),
                lowest: Number(result.rows[0].lowest),
                average: Number(result.rows[0].average),
                count: Number(result.rows[0].count)
            },
            readings: readingsResult.rows
        });

    } catch (error) {
        console.error("Daily report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


 // Get month-to-date glucose report
const getMonthToDateReport = async (req, res) => {
    try {
        const { date } = req.query;

        // Validate date
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "Please provide a valid calendar date."
            });
        }

        // Calculate first day of selected month
        const startDate = `${date.slice(0, 7)}-01`;

        // Fetch summary statistics
        const summaryResult = await pool.query(
            `SELECT
                COALESCE(MAX(glucose_value), 0) AS highest,
                COALESCE(MIN(glucose_value), 0) AS lowest,
                COALESCE(ROUND(AVG(glucose_value), 1), 0) AS average,
                COUNT(*) AS count
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.userId, startDate, date]
        );

        // Fetch individual readings
        const readingsResult = await pool.query(
            `SELECT
                id,
                reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3
             ORDER BY reading_date ASC,
             CASE time_slot
                WHEN 'Morning' THEN 1
                WHEN 'After breakfast' THEN 2
                WHEN 'After lunch' THEN 3
                WHEN 'After dinner' THEN 4
             END`,
            [req.user.userId, startDate, date]
        );

        return res.status(200).json({
            message: "Month-to-date report fetched successfully!",
            startDate,
            endDate: date,
            summary: {
                highest: Number(summaryResult.rows[0].highest),
                lowest: Number(summaryResult.rows[0].lowest),
                average: Number(summaryResult.rows[0].average),
                count: Number(summaryResult.rows[0].count)
            },
            readings: readingsResult.rows
        });

    } catch (error) {
        console.error("Month-to-date report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


// Get previous month's glucose report
const getPreviousMonthReport = async (req, res) => {
    try {
        const { date } = req.query;

        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== date
        ) {
            return res.status(400).json({
                message: "Please provide a valid calendar date."
            });
        }

        // Calculate the previous month's date range
        const currentMonthStart = new Date(Date.UTC(
            parsedDate.getUTCFullYear(),
            parsedDate.getUTCMonth(),
            1
        ));

        const previousMonthEnd = new Date(
            currentMonthStart.getTime() - 24 * 60 * 60 * 1000
        );

        const previousMonthStart = new Date(Date.UTC(
            previousMonthEnd.getUTCFullYear(),
            previousMonthEnd.getUTCMonth(),
            1
        ));

        const startDate = previousMonthStart.toISOString().slice(0, 10);
        const endDate = previousMonthEnd.toISOString().slice(0, 10);

        // Fetch summary statistics
        const summaryResult = await pool.query(
            `SELECT
                COALESCE(MAX(glucose_value), 0) AS highest,
                COALESCE(MIN(glucose_value), 0) AS lowest,
                COALESCE(ROUND(AVG(glucose_value), 1), 0) AS average,
                COUNT(*) AS count
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3`,
            [req.user.userId, startDate, endDate]
        );

        // Fetch all readings
        const readingsResult = await pool.query(
            `SELECT
                id,
                reading_date,
                time_slot,
                glucose_value,
                created_at,
                updated_at
             FROM glucose_readings
             WHERE user_id = $1
             AND reading_date BETWEEN $2 AND $3
             ORDER BY reading_date ASC,
             CASE time_slot
                WHEN 'Morning' THEN 1
                WHEN 'After breakfast' THEN 2
                WHEN 'After lunch' THEN 3
                WHEN 'After dinner' THEN 4
             END`,
            [req.user.userId, startDate, endDate]
        );

        return res.status(200).json({
            message: "Previous month's report fetched successfully!",
            startDate,
            endDate,
            summary: {
                highest: Number(summaryResult.rows[0].highest),
                lowest: Number(summaryResult.rows[0].lowest),
                average: Number(summaryResult.rows[0].average),
                count: Number(summaryResult.rows[0].count)
            },
            readings: readingsResult.rows
        });

    } catch (error) {
        console.error("Previous month report error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

module.exports = {
    getDailyReport,
    getMonthToDateReport,
    getPreviousMonthReport
};
