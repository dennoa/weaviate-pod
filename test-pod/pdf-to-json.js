const fs = require('fs/promises');
const pdf = require('pdf-parse');
const { textToJson } = require('./text-to-json');

async function pdfToJson(doc) {
  try {
    const buffer = await fs.readFile(doc.pathname);
    const result = await pdf(buffer);
    return textToJson(result.text, doc);
  } catch(err) {
    console.error('Error parsing PDF:', err.message);
    return [];
  }
}

module.exports = { pdfToJson };
