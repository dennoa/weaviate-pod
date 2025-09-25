const fs = require('fs/promises');
const path = require('path');
const { textToJson } = require('./text-to-json');

async function textToJsonTest() {
  try {
    const pathname = path.join(__dirname, '..', 'docs', 'thoughts.txt');
    const text = await fs.readFile(pathname, 'utf8');
    const doc = { pathname, type: 'txt', sections: [] };
    const jsonArray = await textToJson(text, doc);
    console.log(JSON.stringify(jsonArray, null, 2));
  } catch(err) {
    console.error('Error reading text file:', err.message);
  }
}

textToJsonTest();