const fs = require('fs/promises');
const pdf = require('pdf-parse');

// - 1,000 tokens ≈ 750 words ≈ 4500 characters (6 to 7 characters per word on average)
// - 4,000 tokens ≈ 3,000 words
// - 8,000 tokens ≈ 6,000 words
// - 32,000 tokens ≈ 24,000 words
const MAX_CHUNK_SIZE = 2000; // Max characters per chunk, maybe aim for 2 chunks per request

async function pdfToJson(doc) {
  try {
    const dataBuffer = await fs.readFile(doc.pathname);
    const data = await pdf(dataBuffer);
    const text = data.text.replace(/\s+/g, ' ').trim(); // Clean up whitespace
    const timestamp = new Date().toJSON();
    const chunks = [];
    let toIdx = 0;
    doc.sections.forEach(section => {
      let fromIdx = text.indexOf(section.from, toIdx);
      toIdx = section.to ? text.indexOf(section.to, fromIdx + section.from.length) : text.length;
      while (fromIdx < toIdx && fromIdx > -1) {
        let end = Math.min(fromIdx + MAX_CHUNK_SIZE, toIdx);          
        // Break at sentence end if possible
        const period = text.indexOf('.', end);
        if (period > fromIdx) {
          end = period + 1;
        }
        const chunkText = text.substring(fromIdx, end);
        chunks.push({ section, text: chunkText });
        fromIdx = end;
      }
    });
    // If no sections matched, fallback to whole text
    if (chunks.length === 0) {
      chunks.push({ section: {}, text });
    }
    return chunks.map((chunk, chunkIdx) => ({
      text: chunk.text.trim(),
      source: doc.pathname,
      lookup: chunk.section.lookup || '',
      timestamp,
      chunkIdx,
    })).filter(item => item.text.length > 0); // Filter out empty chunks
  } catch(err) {
    console.error('Error parsing PDF:', err.message);
    return [];
  }
}

module.exports = { pdfToJson };
