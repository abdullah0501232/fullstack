// task2.js — Student Report Generator
'use strict';

const fs = require('fs/promises');
const path = require('path');
const { getStatus } = require('./utils/gradeUtils');

const DATA_FILE  = path.join(__dirname, 'data', 'students.json');
const REPORTS_DIR = path.join(__dirname, 'reports');
const REPORT_TXT  = path.join(REPORTS_DIR, 'report.txt');
const REPORT_CSV  = path.join(REPORTS_DIR, 'students.csv');
const ACTIVITY_LOG = path.join(REPORTS_DIR, 'activity.log');

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function appendLog(message) {
  await fs.appendFile(ACTIVITY_LOG, message + '\n', 'utf8');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse optional --dept flag
  const deptIndex = process.argv.indexOf('--dept');
  const deptFilter = deptIndex !== -1 ? process.argv[deptIndex + 1] : null;

  // ── 1. Read students.json ────────────────────────────────────────────────
  let allStudents;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    allStudents = JSON.parse(raw);
  } catch (err) {
    const isNotFound = err.code === 'ENOENT';
    const msg = isNotFound
      ? 'Error: students.json not found.'
      : `Error: students.json contains invalid JSON. (${err.message})`;
    console.error(msg);
    // Ensure reports dir exists before writing log
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    await appendLog(`${new Date().toISOString()} | ERROR: ${isNotFound ? 'students.json not found' : 'invalid JSON in students.json'}`);
    process.exit(1);
  }

  // ── 2. Filter by department if flag supplied ─────────────────────────────
  const students = deptFilter
    ? allStudents.filter(s => s.department === deptFilter)
    : allStudents;

  console.log(`Read ${students.length} students.`);

  // ── 3. Create reports directory ──────────────────────────────────────────
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  // ── 4. Build statistics ──────────────────────────────────────────────────
  const total = students.length;
  const avgCgpa = total === 0
    ? 0
    : students.reduce((sum, s) => sum + s.cgpa, 0) / total;

  const topStudent = students.reduce((best, s) => (s.cgpa > (best?.cgpa ?? -1) ? s : best), null);
  const warnCount  = students.filter(s => getStatus(s.cgpa) === 'Academic Warning').length;

  // ── 5. Write report.txt ──────────────────────────────────────────────────
  const divider = '='.repeat(62);
  const now = new Date();
  const lines = [
    'STUDENT REPORT',
    `Generated: ${formatDateTime(now)}`,
    divider,
    ...students.map(s =>
      `${s.name} | ${s.rollNumber} | ${s.department} | ${s.cgpa.toFixed(2)} | ${getStatus(s.cgpa)}`
    ),
    divider,
    `Total Students: ${total}`,
    `Average CGPA: ${avgCgpa.toFixed(2)}`,
    topStudent ? `Highest CGPA: ${topStudent.cgpa.toFixed(2)} (${topStudent.name})` : 'Highest CGPA: N/A',
    `Academic Warning: ${warnCount}`,
  ];

  await fs.writeFile(REPORT_TXT, lines.join('\n') + '\n', 'utf8');
  console.log('Created reports/report.txt');

  // ── 6. Write students.csv ────────────────────────────────────────────────
  const csvHeader = 'name,rollNumber,department,semester,cgpa';
  const csvRows = students.map(
    s => `${s.name},${s.rollNumber},${s.department},${s.semester},${s.cgpa}`
  );
  await fs.writeFile(REPORT_CSV, [csvHeader, ...csvRows].join('\n') + '\n', 'utf8');
  console.log('Created reports/students.csv');

  // ── 7. Append to activity.log ────────────────────────────────────────────
  const label = deptFilter ? ` (${deptFilter})` : '';
  await appendLog(`${now.toISOString()} | processed ${students.length} students${label}`);
  console.log('Logged run in reports/activity.log');
}

main();

