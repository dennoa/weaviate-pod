const fs = require('fs/promises');
const { htmlToText } = require('html-to-text');
const { textToJson } = require('./text-to-json');

async function htmlToJson(doc) {
  try {
    const html = doc.href ? await getHtmlFromUrl(doc.href) : await getHtmlFromFile(doc.pathname);
    const text = htmlToText(html, {
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
      ]
    });
    return textToJson(text, doc);
  } catch(err) {
    console.error('Error parsing HTML:', err.message);
    return [];
  }
}

const getHtmlFromUrl = url => fetch(url).then(res => {
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  return res.text();
});

const getHtmlFromFile = pathname => fs.readFile(pathname, 'utf8');

module.exports = { htmlToJson };
