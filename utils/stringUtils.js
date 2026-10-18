// utils/stringUtils.js

/**
 * Capitalizes the first letter of every word in the given text.
 * @param {string} text
 * @returns {string}
 */
function capitalizeWords(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts text to a URL-friendly slug:
 * lowercase, spaces replaced by hyphens, extra spaces removed.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Counts the number of words in the given text.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  if (typeof text !== 'string' || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

module.exports = { capitalizeWords, slugify, countWords };

