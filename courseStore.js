// courseStore.js — Data Layer for Courses
'use strict';

const fs   = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'courses.json');

/**
 * Reads all courses from the JSON file.
 * @returns {Promise<Object[]>}
 */
async function readAll() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

/**
 * Writes all courses to the JSON file (persists changes).
 * @param {Object[]} courses
 * @returns {Promise<void>}
 */
async function writeAll(courses) {
  await fs.writeFile(DATA_FILE, JSON.stringify(courses, null, 2), 'utf8');
}

module.exports = { readAll, writeAll };

