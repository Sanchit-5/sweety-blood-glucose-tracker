
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/readings", readingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);


// Test PostgreSQL connection
pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("PostgreSQL connected successfully!");
        console.log("Database time:", result.rows[0].now);
    }
});

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to Sweety Backend!");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
