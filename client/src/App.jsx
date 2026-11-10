import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

const SLOTS = [
    "Morning",
    "After breakfast",
    "After lunch",
    "After dinner"
];

function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isRegister
                ? "/auth/register"
                : "/auth/login";

            const response = await api.post(endpoint, form);

            if (isRegister) {
                setIsRegister(false);
                setError("Registration successful! Please log in.");
            } else {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

                onLogin(response.data.user);
                navigate("/dashboard");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="logo">♥ Sweety</div>
                <h1>{isRegister ? "Create Account" : "Welcome Back!"}</h1>
                <p>Track your blood glucose with confidence.</p>

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <input
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email address"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        required
                    />

                    <button disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : isRegister
                                ? "Create Account"
                                : "Login"}
                    </button>
                </form>

                {error && <p className="message">{error}</p>}

                <p>
                    {isRegister
                        ? "Already have an account?"
                        : "Don't have an account?"}

                    <span
                        className="switch"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError("");
                        }}
                    >
                        {isRegister ? " Login" : " Sign up"}
                    </span>
                </p>
            </div>
        </div>
    );
}

function Dashboard({ user, onLogout }) {
    const [readings, setReadings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [reportReadings, setReportReadings] = useState([]);
    const [reportType, setReportType] = useState("daily");
    const [selectedDate, setSelectedDate] = useState(
        new Date().toLocaleDateString("en-CA")
    );

    const [form, setForm] = useState({
        reading_date: new Date().toLocaleDateString("en-CA"),
        time_slot: "Morning",
        glucose_value: ""
    });

    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const loadReadings = async () => {
        try {
            const response = await api.get("/readings");

            const data = response.data;
            setReadings(
                Array.isArray(data)
                    ? data
                    : data.readings || []
            );
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load readings.");
        }
    };

    const loadReport = async () => {
        try {
            setError("");

            const endpoint = {
                daily: "/reports/daily",
                mtd: "/reports/month-to-date",
                previous: "/reports/previous-month"
            }[reportType];

            const response = await api.get(endpoint, {
                params: { date: selectedDate }
            });

            setSummary(response.data.summary);
            setReportReadings(response.data.readings || []);
        } catch (err) {
            setError(
                err.response?.data?.message || "Unable to load report."
            );
        }
    };

    useEffect(() => {
        loadReadings();
    }, []);

    useEffect(() => {
        loadReport();
    }, [reportType, selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const value = Number(form.glucose_value);

        if (!Number.isInteger(value) || value < 40 || value > 600) {
            setError("Glucose value must be a whole number between 40 and 600.");
            return;
        }

        setLoading(true);

        try {
            if (editingId) {
                await api.put(`/readings/${editingId}`, {
                    ...form,
                    glucose_value: value
                });

                setMessage("Reading updated successfully!");
            } else {
                await api.post("/readings", {
                    ...form,
                    glucose_value: value
                });

                setMessage("Reading added successfully!");
            }

            setForm({
                reading_date: new Date().toLocaleDateString("en-CA"),
                time_slot: "Morning",
                glucose_value: ""
            });

            setEditingId(null);

            await loadReadings();
            await loadReport();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save reading.");
        } finally {
            setLoading(false);
        }
    };

    const editReading = (reading) => {
        setEditingId(reading.id);

        setForm({
            reading_date: String(reading.reading_date).slice(0, 10),
            time_slot: reading.time_slot,
            glucose_value: reading.glucose_value
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteReading = async (id) => {
        if (!window.confirm("Are you sure you want to delete this reading?")) {
            return;
        }

        try {
            await api.delete(`/readings/${id}`);
            setMessage("Reading deleted successfully!");
            await loadReadings();
            await loadReport();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete reading.");
        }
    };

    return (
        <div className="dashboard">
            <header className="navbar">
                <div className="logo">♥ Sweety</div>

                <div className="profile">
                    <span>Hello, {user?.name}</span>
                    <button className="logout" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="container">
                <section className="welcome">
                    <h1>Your Glucose Dashboard</h1>
                    <p>Keep track of your health, one reading at a time.</p>
                </section>

                {error && <div className="alert error">{error}</div>}
                {message && <div className="alert success">{message}</div>}

                <section className="panel">
                    <h2>{editingId ? "Update Reading" : "Add Glucose Reading"}</h2>

                    <form className="reading-form" onSubmit={handleSubmit}>
                        <label>
                            Date
                            <input
                                type="date"
                                value={form.reading_date}
                                max={new Date().toLocaleDateString("en-CA")}
                                onChange={(e) =>
                                    setForm({ ...form, reading_date: e.target.value })
                                }
                                required
                            />
                        </label>

                        <label>
                            Time Slot
                            <select
                                value={form.time_slot}
                                onChange={(e) =>
                                    setForm({ ...form, time_slot: e.target.value })
                                }
                            >
                                {SLOTS.map((slot) => (
                                    <option key={slot}>{slot}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Glucose Value (mg/dL)
                            <input
                                type="number"
                                min="40"
                                max="600"
                                step="1"
                                placeholder="e.g. 110"
                                value={form.glucose_value}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        glucose_value: e.target.value
                                    })
                                }
                                required
                            />
                        </label>

                        <button disabled={loading}>
                            {loading
                                ? "Saving..."
                                : editingId
                                    ? "Update Reading"
                                    : "Add Reading"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="cancel"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm({
                                        reading_date: new Date().toLocaleDateString("en-CA"),
                                        time_slot: "Morning",
                                        glucose_value: ""
                                    });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                </section>

                <section className="panel">
                    <h2>My Readings</h2>

                    {readings.length === 0 ? (
                        <p className="empty">No readings available. Add your first reading!</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time Slot</th>
                                        <th>Glucose (mg/dL)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {readings.map((reading) => (
                                        <tr key={reading.id}>
                                            <td>
                                                {String(reading.reading_date).slice(0, 10)}
                                            </td>
                                            <td>{reading.time_slot}</td>
                                            <td>{reading.glucose_value}</td>
                                            <td>
                                                <button
                                                    className="small edit"
                                                    onClick={() => editReading(reading)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="small delete"
                                                    onClick={() => deleteReading(reading.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="panel">
                    <h2>Glucose Reports</h2>

                    <div className="report-controls">
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="daily">Daily Report</option>
                            <option value="mtd">Month-to-date Report</option>
                            <option value="previous">Previous Month Report</option>
                        </select>

                        <input
                            type="date"
                            value={selectedDate}
                            max={new Date().toLocaleDateString("en-CA")}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {summary && (
                        <>
                            <div className="stats">
                                <div className="stat">
                                    <span>Highest</span>
                                    <strong>{summary.highest}</strong>
                                    <small>mg/dL</small>
                                </div>

                                <div className="stat">
                                    <span>Lowest</span>
                                    <strong>{summary.lowest}</strong>
                                    <small>mg/dL</small>
                                </div>

                                <div className="stat">
                                    <span>Average</span>
                                    <strong>{Number(summary.average).toFixed(1)}</strong>
                                    <small>mg/dL</small>
                                </div>

                                <div className="stat">
                                    <span>Total Readings</span>
                                    <strong>{summary.count}</strong>
                                    <small>readings</small>
                                </div>
                            </div>

                            {reportReadings.length === 0 ? (
                                <p className="empty">
                                    No readings found for this reporting period.
                                </p>
                            ) : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Slot</th>
                                                <th>Glucose (mg/dL)</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {reportReadings.map((reading) => (
                                                <tr key={reading.id}>
                                                    <td>
                                                        {String(reading.reading_date).slice(0, 10)}
                                                    </td>
                                                    <td>{reading.time_slot}</td>
                                                    <td>{reading.glucose_value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}

function AppContent() {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <Routes>
            <Route
                path="/"
                element={
                    user
                        ? <Navigate to="/dashboard" replace />
                        : <Auth onLogin={setUser} />
                }
            />

            <Route
                path="/dashboard"
                element={
                    user
                        ? <Dashboard user={user} onLogout={logout} />
                        : <Navigate to="/" replace />
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}