const fs = require('fs/promises');
const { textToJson } = require('./text-to-json');

async function notepadToJson(doc) {
  try {
    const text = await fs.readFile(doc.pathname, 'utf-8');
    return textToJson(text, doc);
  } catch(err) {
    console.error('Error parsing Word Document:', err.message);
    return [];
  }
}

module.exports = { notepadToJson };
