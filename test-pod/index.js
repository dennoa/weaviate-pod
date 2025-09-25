const path = require('path');
const weaviate = require('weaviate-client');
const { htmlToJson } = require('./html-to-json');
const { notepadToJson } = require('./notepad-to-json');
const { pdfToJson } = require('./pdf-to-json');
const { wordToJson } = require('./word-to-json');

const { vectors, generative } = weaviate;

// Collection names must start with an uppercase letter
// In this example, collection class definitions are created automatically from the data
const collectionName = 'NCCD';

weaviate.connectToLocal().then(async (client) => {
  var isReady = await client.isReady();
  if (isReady) {
    await createCollection(client);
    await queryCollection(client);
  } else {
    console.error('Weaviate is not ready');
  }
  client.close(); // Close the client connection
}).catch((error) => {
  console.error('Error connecting to Weaviate:', error);
});

async function createCollection(client) {
  try {
    const exists = await client.collections.exists(collectionName);
    if (!exists) {
      await client.collections.create({
        name: collectionName,
        vectorizers: vectors.text2VecOllama({ // Configure the Ollama embedding integration
          apiEndpoint: 'http://ollama:11434',
          model: 'nomic-embed-text',
        }),
        generative: generative.ollama({ // Configure the Ollama generative integration
          apiEndpoint: 'http://ollama:11434',
          model: 'llama3.2',
        }),
      });
      await loadDocs(client);
    } else {
      console.log(`Collection "${collectionName}" already exists`);
    }
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

const docs = [
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-planning.pdf'),
    type: 'pdf',
    sections: [
      { from: 'Introduction Schools have responsibility', to: 'Guiding principles', lookup: 'Pages 4-5' },
      { to: 'Process The United Nations Convention', lookup: 'Pages 5-6' },
      { to: 'Below are four key steps', lookup: 'Page 6' },
      { to: 'Where to go for additional guidance or assistance', lookup: 'Page 7' },
      { to: 'Resources National resources', lookup: 'Page 8' },
      { lookup: 'Pages 9-10' },
    ],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-moderation.pdf'),
    type: 'pdf',
    sections: [
      { from: 'Introduction All schools in Australia', to: 'The moderation process and timeline is shown in Figure 1', lookup: 'Pages 4-6' },
      { to: 'Part C: Reference material Below are reference materials', lookup: 'Pages 9-12' },
      { from: 'Appendix 2: Selecting the level of adjustment Support provided', lookup: 'Pages 15-17' },
    ],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-decision-making.pdf'),
    type: 'pdf',
    sections: [
      { from: 'Introduction The Nationally Consistent Collection', to: 'Strategies to support decision-making: Step 1 Which students are included', lookup: 'Pages 3-4' },
      { to: 'Strategies to support decision-making: Step 2 Level of adjustment', lookup: 'Pages 5-7' },
      { to: 'Strategies to support decision-making: Step 3', lookup: 'Pages 7-8' },
      { to: 'Additional support and resources', lookup: 'Page 8' },
      { lookup: 'Page 9' },
    ],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-student-summary-sheet.docx'),
    type: 'docx',
    sections: [],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'thoughts.txt'),
    type: 'txt',
    sections: [],
  },
  {
    href:'https://www.nccd.edu.au/case-studies/harley-supplementary-cognitive',
    type: 'html',
    sections: [],
  },
];

async function loadDocs(client) {
  try {
    await Promise.all(docs.map(async doc => {      
      const jsonArray = await getJsonArray(doc);
      const questions = client.collections.use(collectionName);
      const result = await questions.data.insertMany(jsonArray);
      console.log(`${collectionName} insert response: `, result);
    }));
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

function getJsonArray(doc) {
  switch(doc.type) {
    case 'docx':
      return wordToJson(doc);
    case 'html':
      return htmlToJson(doc);
    case 'pdf':
      return pdfToJson(doc);
    case 'txt':
      return notepadToJson(doc);
    default:
      console.error('Unsupported document type:', doc.type);
      return [];
  }
}

const queryText = 'I have 2 students with autism and 1 student with dyslexia. What adjustments should I make for them?';

async function queryCollection(client) {
  try {
    const collection = client.collections.use(collectionName);
    const result = await collection.query.nearText(queryText, { limit: 4 });
    console.log(`\nQuery results for: "${queryText}"\n`);
    let combinedText = '';
    result.objects.forEach((item) => {
      combinedText += `\n\n${item.properties.text}`;
      console.log(JSON.stringify(item.properties, null, 2));
    });
    console.log(`\n\nCombined text results for: "${queryText}"`);
    console.log(combinedText);
    console.log(await htmlToJson(docs[5]))
  } catch (error) {
    console.error('Error querying collection:', error);
  }
}