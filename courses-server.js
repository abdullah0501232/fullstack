// courses-server.js — Course REST API
'use strict';

const express = require('express');
const fs      = require('fs/promises');
const path    = require('path');
const store   = require('./courseStore');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Logs setup ───────────────────────────────────────────────────────────────
const LOGS_DIR   = path.join(__dirname, 'logs');
const ACCESS_LOG = path.join(LOGS_DIR, 'requests.log');

async function ensureLogsDir() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse JSON bodies; capture syntax errors
app.use((req, res, next) => {
  express.json()(req, res, err => {
    if (err) {
      return res.status(400).json({ error: 'Malformed JSON body.' });
    }
    next();
  });
});

// Logging middleware — appends one line per request after response finishes
app.use((req, res, next) => {
  res.on('finish', () => {
    const line = `${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode}\n`;
    fs.appendFile(ACCESS_LOG, line).catch(() => {});   // fire-and-forget; never crash
  });
  next();
});

// ── Validation ────────────────────────────────────────────────────────────────
const CODE_PATTERN = /^CS-\d{3}L?$/;
const VALID_DEPTS  = ['Computer Science', 'Software Engineering', 'Data Science'];

function validateCourse(body, isPartial = false) {
  const errors = [];
  const { code, title, creditHours, instructor, department } = body;

  if (!isPartial || code !== undefined) {
    if (!code || !CODE_PATTERN.test(code)) {
      errors.push('code must look like CS-301 or CS-301L');
    }
  }
  if (!isPartial || title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push('title must be at least 3 characters');
    }
  }
  if (!isPartial || creditHours !== undefined) {
    if (
      creditHours === undefined ||
      !Number.isInteger(creditHours) ||
      creditHours < 1 ||
      creditHours > 4
    ) {
      errors.push('creditHours must be a whole number from 1 to 4');
    }
  }
  if (!isPartial || instructor !== undefined) {
    if (!instructor || typeof instructor !== 'string' || instructor.trim().length < 3) {
      errors.push('instructor must be at least 3 characters');
    }
  } else if (!isPartial && !instructor) {
    errors.push('instructor is required');
  }
  if (!isPartial || department !== undefined) {
    if (!department || !VALID_DEPTS.includes(department)) {
      errors.push(`department must be one of: ${VALID_DEPTS.join(', ')}`);
    }
  }

  // Extra: catch completely missing required fields for POST (non-partial)
  if (!isPartial) {
    if (instructor === undefined || instructor === null) {
      if (!errors.includes('instructor must be at least 3 characters')) {
        errors.push('instructor is required');
      }
    }
    if (department === undefined || department === null) {
      if (!errors.find(e => e.startsWith('department'))) {
        errors.push('department is required');
      }
    }
  }

  return errors;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/courses — list with optional ?department, ?search, ?sort, ?order
app.get('/api/courses', async (req, res) => {
  try {
    let courses = await store.readAll();

    const { department, search, sort, order } = req.query;

    if (department) {
      courses = courses.filter(c => c.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      courses = courses.filter(
        c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    }
    if (sort === 'creditHours') {
      const dir = order === 'desc' ? -1 : 1;
      courses = courses.slice().sort((a, b) => dir * (a.creditHours - b.creditHours));
    }

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read courses.', details: err.message });
  }
});

// GET /api/courses/stats — MUST be before /:code
app.get('/api/courses/stats', async (req, res) => {
  try {
    const courses = await store.readAll();

    const totalCourses = courses.length;
    const totalCreditHours = courses.reduce((sum, c) => sum + c.creditHours, 0);
    const averageCreditHours =
      totalCourses === 0 ? 0 : parseFloat((totalCreditHours / totalCourses).toFixed(2));

    const mostCredits = courses.reduce(
      (best, c) => (c.creditHours > (best?.creditHours ?? -1) ? c : best),
      null
    );

    res.json({
      totalCourses,
      totalCreditHours,
      averageCreditHours,
      mostCredits: mostCredits
        ? { code: mostCredits.code, title: mostCredits.title }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats.', details: err.message });
  }
});

// GET /api/courses/:code — get one course
app.get('/api/courses/:code', async (req, res) => {
  try {
    const courses = await store.readAll();
    const course = courses.find(c => c.code === req.params.code);
    if (!course) return res.status(404).json({ error: `Course ${req.params.code} not found.` });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read courses.', details: err.message });
  }
});

// POST /api/courses — create a new course
app.post('/api/courses', async (req, res) => {
  try {
    const errors = validateCourse(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const courses = await store.readAll();
    const { code, title, creditHours, instructor, department } = req.body;

    if (courses.find(c => c.code === code)) {
      return res.status(409).json({ error: `Course ${code} already exists` });
    }

    const newCourse = { code, title, creditHours, instructor, department };
    courses.push(newCourse);
    await store.writeAll(courses);

    res
      .status(201)
      .set('Location', `/api/courses/${code}`)
      .json(newCourse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course.', details: err.message });
  }
});

// PUT /api/courses/:code — full replace
app.put('/api/courses/:code', async (req, res) => {
  try {
    const errors = validateCourse(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const courses = await store.readAll();
    const idx = courses.findIndex(c => c.code === req.params.code);
    if (idx === -1) {
      return res.status(404).json({ error: `Course ${req.params.code} not found.` });
    }

    const { code, title, creditHours, instructor, department } = req.body;
    courses[idx] = { code: courses[idx].code, title, creditHours, instructor, department };
    await store.writeAll(courses);

    res.json(courses[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course.', details: err.message });
  }
});

// PATCH /api/courses/:code — partial update
app.patch('/api/courses/:code', async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body must not be empty.' });
    }

    const errors = validateCourse(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const courses = await store.readAll();
    const idx = courses.findIndex(c => c.code === req.params.code);
    if (idx === -1) {
      return res.status(404).json({ error: `Course ${req.params.code} not found.` });
    }

    // Disallow changing the code via PATCH
    const { code: _ignore, ...updates } = req.body;
    courses[idx] = { ...courses[idx], ...updates };
    await store.writeAll(courses);

    res.json(courses[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to patch course.', details: err.message });
  }
});

// DELETE /api/courses/:code
app.delete('/api/courses/:code', async (req, res) => {
  try {
    const courses = await store.readAll();
    const idx = courses.findIndex(c => c.code === req.params.code);
    if (idx === -1) {
      return res.status(404).json({ error: `Course ${req.params.code} not found.` });
    }
    courses.splice(idx, 1);
    await store.writeAll(courses);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course.', details: err.message });
  }
});

// ── 404 for unknown routes ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error-handling middleware (4 params) ───────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.', details: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────
ensureLogsDir()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Courses API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize logs directory:', err.message);
    process.exit(1);
  });

