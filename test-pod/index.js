const fs = require('fs/promises');
const path = require('path');
const weaviate = require('weaviate-client');
const { pdfToJson } = require('./pdf-to-json');

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
    sections: [
      { from: 'Introduction Schools have responsibility', to: 'Guiding principles', lookup: 'Pages 4-5' },
      { from: 'Guiding principles', to: 'Process The United Nations Convention', lookup: 'Pages 5-6' },
      { from: 'Process The United Nations Convention', to: 'Below are four key steps', lookup: 'Page 6' },
      { from: 'Below are four key steps', to: 'Where to go for additional guidance or assistance', lookup: 'Page 7' },
      { from: 'Where to go for additional guidance or assistance', to: 'Resources National resources', lookup: 'Page 8' },
      { from: 'Resources National resources', to: 'Resources National resources', lookup: 'Pages 9-10' },
    ],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-moderation.pdf'),
    sections: [
      { from: 'Introduction All schools in Australia', to: 'The moderation process and timeline is shown in Figure 1', lookup: 'Pages 4-6' },
      { from: 'Part B: NCCD moderation process The process described in Figure 1', to: 'Part C: Reference material Below are reference materials', lookup: 'Pages 9-12' },
      { from: 'Appendix 2: Selecting the level of adjustment Support provided', lookup: 'Pages 15-17' },
    ],
  },
  {
    pathname: path.join(__dirname, '..', 'docs', 'NCCD-decision-making.pdf'),
    sections: [
      { from: 'Introduction The Nationally Consistent Collection', to: 'Strategies to support decision-making: Step 1 Which students are included', lookup: 'Pages 3-4' },
      { from: 'Strategies to support decision-making: Step 1 Which students are included', to: 'Strategies to support decision-making: Step 2 Level of adjustment', lookup: 'Pages 5-7' },
      { from: 'Strategies to support decision-making: Step 2 Level of adjustment', lookup: 'Pages 7-9' },
    ],
  },
];

async function loadDocs(client) {
  try {
    await Promise.all(docs.map(async doc => {      
      const jsonData = await pdfToJson(doc);
      const questions = client.collections.use(collectionName);
      const result = await questions.data.insertMany(jsonData);
      console.log(`${collectionName} insert response: `, result);
    }));
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

async function queryCollection(client) {
  try {
    const collection = client.collections.use(collectionName);
    const result = await collection.query.nearText('Where can I find disability definitions', { limit: 2 });
    result.objects.forEach((item) => {
      console.log(JSON.stringify(item.properties, null, 2));
    });
  } catch (error) {
    console.error('Error querying collection:', error);
  }
}