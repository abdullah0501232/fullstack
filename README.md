# Lab 07 — Modules, File I/O & Express REST API

CS-301L | Full Stack Web Development

---

## Project Structure

```
lab07/
├── data/
│   ├── students.json       # 8 sample students
│   └── courses.json        # 7 sample courses
├── utils/
│   ├── stringUtils.js      # capitalizeWords, slugify, countWords
│   └── gradeUtils.js       # getStatus, letterGrade, calculateGPA
├── postman/
│   └── Lab07_Courses_API.postman_collection.json
├── screenshots/
│   └── runner-result.png   # Collection Runner screenshot (add manually)
├── task1.js                # Task 1 — CLI tool
├── task2.js                # Task 2 — Report generator
├── courseStore.js          # Task 3 — Data layer
├── courses-server.js       # Task 3 — Express API
├── package.json
├── .gitignore
└── README.md
```

---

## Setup

```bash
# Install dependencies (express only)
npm install
```

---

## Task 1 — Command-Line Tool

```bash
node task1.js slug " Full Stack Web Development "
node task1.js capitalize "artificial intelligence lab"
node task1.js words "Node.js runs JavaScript on the server"
node task1.js status 2.45
node task1.js grade 78
node task1.js gpa 4.0:3 3.5:3 2.7:4
node task1.js info
```

**Error handling:**
```bash
node task1.js status abc     # Error: CGPA must be a number between 0 and 4.
node task1.js                # Error: No command provided.
node task1.js unknown        # Error: Unknown command "unknown".
```

---

## Task 2 — Student Report Generator

```bash
# Process all students
node task2.js

# Process one department only
node task2.js --dept "Data Science"
```

Outputs are written to the `reports/` folder:
- `reports/report.txt` — formatted report with statistics
- `reports/students.csv` — CSV export
- `reports/activity.log` — appended log entry per run

---

## Task 3 — Course REST API

```bash
# Start the server (default port 3000)
npm run start:courses

# Or with a custom port
PORT=4000 npm run start:courses
```

### API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/courses` | List all (supports `?department`, `?search`, `?sort`, `?order`) |
| GET | `/api/courses/stats` | Aggregate statistics |
| GET | `/api/courses/:code` | Get one course |
| POST | `/api/courses` | Create a course |
| PUT | `/api/courses/:code` | Full replace |
| PATCH | `/api/courses/:code` | Partial update |
| DELETE | `/api/courses/:code` | Delete |

### Example requests

```bash
# Filter + sort
curl "http://localhost:3000/api/courses?department=Data%20Science&sort=creditHours&order=desc"

# Stats
curl http://localhost:3000/api/courses/stats

# Create
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"code":"CS-500","title":"Advanced Node","creditHours":3,"instructor":"Dr. X","department":"Computer Science"}'
```

Request logs are written to `logs/requests.log`.

---

## Task 4 — Postman Collection

1. Open Postman → **Import** → select `postman/Lab07_Courses_API.postman_collection.json`
2. Make sure the server is running (`npm run start:courses`)
3. Open **Collection Runner**, select **Lab 07 Tasks / Courses API**
4. Click **Run** — all 16 requests / tests should pass
5. Save a screenshot to `screenshots/runner-result.png`

---

## Notes

- `node_modules/`, `reports/`, and `logs/` are in `.gitignore` and are not committed.
- All data changes to the courses API are persisted in `data/courses.json`.
- The Postman collection is re-runnable: the course created by request 8 is deleted by request 15.

