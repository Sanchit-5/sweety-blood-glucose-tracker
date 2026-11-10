
# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application built using React, Node.js, Express, and PostgreSQL.

Users can securely register and log in, record their daily glucose readings, update or delete readings, and view daily and monthly reports.

## Features

### Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- User-specific reading access

### Glucose Readings
- Add, view, update, and delete readings
- Four daily time slots:
  - Morning (fasting)
  - After breakfast
  - After lunch
  - After dinner
- Glucose values restricted to 40–600 mg/dL
- One reading per time slot per day
- Future dates are not allowed
- Input validation and meaningful error messages

### Reports
- Daily report
- Month-to-date report
- Previous-month report
- Highest glucose value
- Lowest glucose value
- Average glucose value
- Total reading count
- Empty states when no readings are available

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express.js
- PostgreSQL
- node-postgres (pg)
- bcrypt
- JSON Web Token
- CORS

## Project Structure

```text
sweety/
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── schema.sql
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── readingController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── readingRoutes.js
│   │   └── reportRoutes.js
│   ├── seed.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   └── main.jsx
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

Open PostgreSQL and run:

```sql
CREATE DATABASE sweety_db;
```

### 4. Create the database tables

From the project root, run:

```bash
psql -U postgres -d sweety_db -f server/config/schema.sql
```

### 5. Configure environment variables

Copy `.env.example` to `.env`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your PostgreSQL password and a strong JWT secret.

Never commit your `.env` file.

### 6. Seed demo data

```bash
npm run seed
```

Demo account:

- Email: `demo@sweety.local`
- Password: `SweetyDemo123!`

### 7. Start the backend

```bash
node server/server.js
```

The backend runs at:

```text
http://localhost:5000
```

### 8. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 9. Start the frontend

```bash
npm run dev
```

Open the local Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get authenticated user |

### Glucose Readings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/readings` | Create a reading |
| GET | `/api/readings` | Get current user's readings |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Daily report |
| GET | `/api/reports/month-to-date?date=YYYY-MM-DD` | Month-to-date report |
| GET | `/api/reports/previous-month?date=YYYY-MM-DD` | Previous-month report |

Protected endpoints require this header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Validation and Security

- Passwords are hashed with bcrypt.
- JWT authentication protects private endpoints.
- SQL queries use parameterized values.
- Users can access only their own readings.
- Glucose values must be whole numbers from 40 to 600.
- Only the four supported time slots are accepted.
- Duplicate readings for the same user, date, and slot are prevented.
- Future reading dates are rejected.
- Database constraints provide additional validation.

## Testing Checklist

The following should be verified before release:

- User registration and login
- Invalid credentials
- Protected routes without a token
- Add, edit, view, and delete readings
- Minimum and maximum glucose values
- Invalid and decimal glucose values
- Duplicate time slots
- Future dates
- User data isolation
- Daily report
- Month-to-date report
- Previous-month report
- Empty report state

## Assumptions

- Each user manages their own glucose readings.
- A user can add up to four readings per date.
- Each of the four supported time slots can have only one reading per date.
- Glucose readings are stored in mg/dL.
- Reports are calculated using the selected date and the user's own records.

## Future Improvements

- Glucose trend charts
- Pagination for reading history
- Automated backend and frontend tests
- Docker support
- Daily reminders
- Doctor or healthcare-provider access with appropriate permissions

## Author

Developed as a full-stack project using React, Node.js, Express, and PostgreSQL.
