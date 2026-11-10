
const bcrypt = require("bcrypt");
const pool = require("./config/db");

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const passwordHash = await bcrypt.hash(
            "SweetyDemo123!",
            12
        );

        const userResult = await client.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            ["Sweety Demo", "demo@sweety.local", passwordHash]
        );

        const userId = userResult.rows[0].id;

        const readings = [
            ["Morning", 105],
            ["After breakfast", 132],
            ["After lunch", 118],
            ["After dinner", 125]
        ];

        for (const [slot, value] of readings) {
            await client.query(
                `INSERT INTO glucose_readings
                    (user_id, reading_date, time_slot, glucose_value)
                 VALUES ($1, CURRENT_DATE, $2, $3)
                 ON CONFLICT (user_id, reading_date, time_slot)
                 DO UPDATE SET
                    glucose_value = EXCLUDED.glucose_value,
                    updated_at = CURRENT_TIMESTAMP`,
                [userId, slot, value]
            );
        }

        await client.query("COMMIT");

        console.log("Database seeded successfully!");
        console.log("Email: demo@sweety.local");
        console.log("Password: SweetyDemo123!");

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
