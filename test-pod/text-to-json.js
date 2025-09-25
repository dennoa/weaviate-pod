// - 1,000 tokens ≈ 750 words ≈ 4500 characters (6 to 7 characters per word on average)
// - 4,000 tokens ≈ 3,000 words
// - 8,000 tokens ≈ 6,000 words
// - 32,000 tokens ≈ 24,000 words
const TARGET_WORDS_PER_CHUNK = 100; // Aim for this many words per chunk, maybe 4 chunks per request
const MIN_OVERLAP_WORDS = 10; // Minimum overlap between chunks to maintain context
const MAX_OVERLAP_WORDS = 20; // Maximum overlap between chunks to avoid too much duplication
const MIN_WORDS_PER_CHUNK = 50; // Minimum words per chunk to avoid too small chunks

function textToJson(rawText, doc) {
  const text = rawText.replace(/\s+/g, ' ').trim(); // Clean up whitespace
  const timestamp = new Date().toJSON();
  const chunks = [];
  const docToUse = doc.sections.length > 0 ? doc : { ...doc, sections: [{ section: {} }] };
  populateChunks(chunks, text, docToUse);
  return chunks.map((chunk, chunkIdx) => ({
    text: chunk.text.trim(),
    source: doc.pathname || doc.href || '',
    lookup: chunk.section.lookup || '',
    timestamp,
    chunkIdx,
  })).filter(item => item.text.length > 0); // Filter out empty chunks
}

const isSentenceEnd = text => text.endsWith('.') || text.endsWith('!') || text.endsWith('?');

function populateChunks(chunks, text, doc) {
  let toIdx = 0;
  doc.sections.forEach(section => {
    let fromIdx = section.from ? text.indexOf(section.from, toIdx) : toIdx;
    toIdx = section.to ? text.indexOf(section.to, fromIdx + 1) : text.length;
    const words = text.substring(fromIdx, toIdx).split(' ');
    let startIdx = 0;
    while (startIdx < words.length) {
      let endIdx = startIdx + TARGET_WORDS_PER_CHUNK; // Target end
      while (endIdx < words.length && !isSentenceEnd(words[endIdx])) endIdx++; // Extend to sentence end
      endIdx++; // Include the sentence end      
      if (endIdx + MIN_WORDS_PER_CHUNK >= words.length) {
        endIdx = Math.min(endIdx + MIN_WORDS_PER_CHUNK, words.length); // Next chunk too small so extend this chunk
      }
      const chunkText = words.slice(startIdx, endIdx).join(' ');
      chunks.push({ section, text: chunkText });
      startIdx = endIdx;
      if (endIdx < words.length) {
        startIdx = endIdx - MIN_OVERLAP_WORDS;
        const minStartIdx = endIdx - MAX_OVERLAP_WORDS;
        while (startIdx >= minStartIdx && !isSentenceEnd(words[startIdx])) startIdx--; // Extend to sentence start
        startIdx++; // Do not include the previous sentence end
      }
    }
  });
}

module.exports = { textToJson };
