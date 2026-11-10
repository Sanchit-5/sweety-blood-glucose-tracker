const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        // 1. Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Validate name length
        if (cleanName.length > 100) {
            return res.status(400).json({
                message: "Name must not exceed 100 characters."
            });
        }

        // Validate email length
        if (cleanEmail.length > 255) {
            return res.status(400).json({
                message: "Email must not exceed 255 characters."
            });
        }

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // 3. Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        // bcrypt supports a maximum of 72 bytes
        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Password must not exceed 72 bytes."
            });
        }

        // 4. Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // 5. Save user in PostgreSQL
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, created_at`,
            [cleanName, cleanEmail, passwordHash]
        );

        // 6. Send successful response
        return res.status(201).json({
            message: "Registration successful!",
            user: result.rows[0]
        });

    } catch (error) {
        // Handle duplicate email
        if (error.code === "23505") {
            return res.status(409).json({
                message: "This email is already registered."
            });
        }

        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

// Login an existing user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // 1. Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // 2. Find user by email
        const cleanEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password_hash
            FROM users
            WHERE email = $1`,
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        // 3. Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // 4. Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 5. Send successful response
        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

module.exports = { registerUser, loginUser };