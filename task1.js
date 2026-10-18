// task1.js — Command-Line Tool
'use strict';

const os = require('os');
const { capitalizeWords, slugify, countWords } = require('./utils/stringUtils');
const { getStatus, letterGrade, calculateGPA } = require('./utils/gradeUtils');

const USAGE = `Usage: node task1.js <command> <value>
Commands: slug, capitalize, words, status, grade, gpa, info`;

function exitWithError(msg) {
  console.error(`Error: ${msg}`);
  console.error(USAGE);
  process.exit(1);
}

const [, , command, ...args] = process.argv;

if (!command) {
  exitWithError('No command provided.');
}

switch (command) {
  // ── slug ──────────────────────────────────────────────────────────────────
  case 'slug': {
    if (!args[0]) exitWithError('slug requires a text argument.');
    console.log(slugify(args[0]));
    break;
  }

  // ── capitalize ────────────────────────────────────────────────────────────
  case 'capitalize': {
    if (!args[0]) exitWithError('capitalize requires a text argument.');
    console.log(capitalizeWords(args[0]));
    break;
  }

  // ── words ─────────────────────────────────────────────────────────────────
  case 'words': {
    if (!args[0]) exitWithError('words requires a text argument.');
    console.log(`Word count: ${countWords(args[0])}`);
    break;
  }

  // ── status ────────────────────────────────────────────────────────────────
  case 'status': {
    const cgpa = parseFloat(args[0]);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
      exitWithError('CGPA must be a number between 0 and 4.');
    }
    try {
      console.log(`CGPA ${cgpa} -> ${getStatus(cgpa)}`);
    } catch (err) {
      exitWithError(err.message);
    }
    break;
  }

  // ── grade ─────────────────────────────────────────────────────────────────
  case 'grade': {
    const marks = parseFloat(args[0]);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      exitWithError('Marks must be a number between 0 and 100.');
    }
    try {
      console.log(`Marks ${marks} -> Grade ${letterGrade(marks)}`);
    } catch (err) {
      exitWithError(err.message);
    }
    break;
  }

  // ── gpa ───────────────────────────────────────────────────────────────────
  case 'gpa': {
    if (args.length === 0) exitWithError('gpa requires at least one points:credits pair.');

    const courses = [];
    for (const pair of args) {
      const parts = pair.split(':');
      if (parts.length !== 2) exitWithError(`Invalid pair "${pair}". Expected format points:credits.`);
      const points = parseFloat(parts[0]);
      const credits = parseFloat(parts[1]);
      if (isNaN(points) || isNaN(credits) || credits <= 0) {
        exitWithError(`Invalid values in pair "${pair}". Points and credits must be numbers, credits > 0.`);
      }
      courses.push({ points, credits });
    }

    try {
      const { gpa, totalCredits } = calculateGPA(courses);
      console.log(`Credit hours: ${totalCredits}`);
      console.log(`GPA: ${gpa.toFixed(2)}`);
    } catch (err) {
      exitWithError(err.message);
    }
    break;
  }

  // ── info ──────────────────────────────────────────────────────────────────
  case 'info': {
    const platform = os.platform();
    const cpus = os.cpus().length;
    const freeMem = Math.round(os.freemem() / (1024 * 1024));
    console.log(`Platform: ${platform} | CPU cores: ${cpus} | Free memory: ${freeMem} MB`);
    break;
  }

  // ── unknown ───────────────────────────────────────────────────────────────
  default: {
    exitWithError(`Unknown command "${command}".`);
  }
}

