const fs = require('fs/promises');
const mammoth = require('mammoth');
const { textToJson } = require('./text-to-json');

async function wordToJson(doc) {
  try {
    const buffer = await fs.readFile(doc.pathname);
    const result = await mammoth.extractRawText({ buffer });
    return textToJson(result.value, doc);
  } catch(err) {
    console.error('Error parsing Word Document:', err.message);
    return [];
  }
}

module.exports = { wordToJson };
