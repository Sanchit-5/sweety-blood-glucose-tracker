
const pool = require("../config/db");

// Validate reading ID
const isValidReadingId = (id) => {
    return /^[1-9]\d*$/.test(id) &&
        BigInt(id) <= 9223372036854775807n;
};


// Check whether a reading date is in the future
const isFutureDate = async (readingDate) => {
    const result = await pool.query(
        "SELECT $1::date > CURRENT_DATE AS is_future",
        [readingDate]
    );

    return result.rows[0].is_future;
};

// Create a new glucose reading
const createReading = async (req, res) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        // 1. Validate required fields
        if (!reading_date || !time_slot || glucose_value === undefined) {
            return res.status(400).json({
                message: "Date, time slot and glucose value are required."
            });
        }

        // 2. Validate date format
        if (
            typeof reading_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
        ) {
            return res.status(400).json({
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        // Check that the date actually exists
        const parsedDate = new Date(`${reading_date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== reading_date
        ) {
            return res.status(400).json({
                message: "Please provide a valid calendar date."
            });
        }

        // 3. Prevent future dates
        if (await isFutureDate(reading_date)) {
            return res.status(400).json({
                message: "Future dates are not allowed."
            });
        }

        // 4. Validate time slot
        const validSlots = [
            "Morning",
            "After breakfast",
            "After lunch",
            "After dinner"
        ];

        if (!validSlots.includes(time_slot)) {
            return res.status(400).json({
                message: "Please select a valid time slot."
            });
        }

        // 5. Validate glucose value
        if (
            !Number.isInteger(glucose_value) ||
            glucose_value < 40 ||
            glucose_value > 600
        ) {
            return res.status(400).json({
                message: "Glucose value must be a whole number between 40 and 600."
            });
        }

        // 6. Save reading for the authenticated user
        const result = await pool.query(
            `INSERT INTO glucose_readings
                (user_id, reading_date, time_slot, glucose_value)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                req.user.userId,
                reading_date,
                time_slot,
                glucose_value
            ]
        );

        return res.status(201).json({
            message: "Glucose reading saved successfully!",
            reading: result.rows[0]
        });

    } catch (error) {
        // Duplicate slot for the same date
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this time slot on this date."
            });
        }

        console.error("Create reading error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

// Get all readings for the logged-in user
const getReadings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM glucose_readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, created_at DESC`,
            [req.user.userId]
        );

        return res.status(200).json({
            message: "Readings fetched successfully!",
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


// Update an existing glucose reading
const updateReading = async (req, res) => {
    
    try {
        const { id } = req.params;

        if (!isValidReadingId(id)) {
            return res.status(400).json({
                message: "Please provide a valid reading ID."
            });
        }

        const { reading_date, time_slot, glucose_value } = req.body;

        // Validate required fields
        if (
            !reading_date ||
            !time_slot ||
            glucose_value === undefined
        ) {
            return res.status(400).json({
                message: "Date, time slot and glucose value are required."
            });
        }

        // Validate date format
        if (
            typeof reading_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
        ) {
            return res.status(400).json({
                message: "Please provide a valid date in YYYY-MM-DD format."
            });
        }

        const parsedDate = new Date(`${reading_date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== reading_date
        ) {
            return res.status(400).json({
                message: "Please provide a valid calendar date."
            });
        }

        // Reject future dates
        if (await isFutureDate(reading_date)) {
            return res.status(400).json({
                message: "Future dates are not allowed."
            });
        }

        // Validate time slot
        const validSlots = [
            "Morning",
            "After breakfast",
            "After lunch",
            "After dinner"
        ];

        if (!validSlots.includes(time_slot)) {
            return res.status(400).json({
                message: "Please select a valid time slot."
            });
        }

        // Validate glucose value
        if (
            !Number.isInteger(glucose_value) ||
            glucose_value < 40 ||
            glucose_value > 600
        ) {
            return res.status(400).json({
                message: "Glucose value must be a whole number between 40 and 600."
            });
        }

        // Update only the logged-in user's reading
        const result = await pool.query(
            `UPDATE glucose_readings
             SET reading_date = $1,
                 time_slot = $2,
                 glucose_value = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [
                reading_date,
                time_slot,
                glucose_value,
                id,
                req.user.userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            message: "Glucose reading updated successfully!",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this time slot on this date."
            });
        }

        console.error("Update reading error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


 // Delete a glucose reading
const deleteReading = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidReadingId(id)) {
            return res.status(400).json({
                message: "Please provide a valid reading ID."
            });
        }

        const result = await pool.query(
            `DELETE FROM glucose_readings
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            message: "Glucose reading deleted successfully!",
            reading: result.rows[0]
        });

    } catch (error) {
        console.error("Delete reading error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


module.exports = {
    createReading,
    getReadings,
    updateReading,
    deleteReading
};
