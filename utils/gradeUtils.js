// utils/gradeUtils.js

/**
 * Returns the academic status string based on CGPA (Lab 06 table).
 * Uses ternary operator chain.
 * @param {number} cgpa
 * @returns {string}
 */
function getStatus(cgpa) {
  if (typeof cgpa !== 'number' || isNaN(cgpa) || cgpa < 0 || cgpa > 4) {
    throw new Error('CGPA must be a number between 0 and 4.');
  }
  return cgpa >= 3.5
    ? 'Excellent'
    : cgpa >= 3.0
    ? 'Very Good'
    : cgpa >= 2.5
    ? 'Good'
    : cgpa >= 2.0
    ? 'Satisfactory'
    : cgpa >= 1.0
    ? 'Academic Warning'
    : 'Fail';
}

/**
 * Returns the letter grade based on marks out of 100.
 * A: 85+, B: 70–84, C: 55–69, D: 40–54, F: below 40.
 * @param {number} marks
 * @returns {string}
 */
function letterGrade(marks) {
  if (typeof marks !== 'number' || isNaN(marks) || marks < 0 || marks > 100) {
    throw new Error('Marks must be a number between 0 and 100.');
  }
  return marks >= 85
    ? 'A'
    : marks >= 70
    ? 'B'
    : marks >= 55
    ? 'C'
    : marks >= 40
    ? 'D'
    : 'F';
}

/**
 * Calculates the credit-weighted GPA from an array of { points, credits } objects.
 * @param {{ points: number, credits: number }[]} courses
 * @returns {number}
 */
function calculateGPA(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error('courses must be a non-empty array of { points, credits } objects.');
  }

  const { totalPoints, totalCredits } = courses.reduce(
    (acc, { points, credits }) => {
      acc.totalPoints += points * credits;
      acc.totalCredits += credits;
      return acc;
    },
    { totalPoints: 0, totalCredits: 0 }
  );

  if (totalCredits === 0) throw new Error('Total credit hours cannot be zero.');
  return { gpa: totalPoints / totalCredits, totalCredits };
}

module.exports = { getStatus, letterGrade, calculateGPA };

