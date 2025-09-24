const fs = require('fs/promises');
const path = require('path');
const weaviate = require('weaviate-client');

const { vectors, generative } = weaviate;

// Collection names must start with an uppercase letter
// In this example, collection class definitions are created automatically from the data
const testCollectionName = 'TestQuestions';

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
    const exists = await client.collections.exists(testCollectionName);
    if (!exists) {
      await client.collections.create({
        name: testCollectionName,
        vectorizers: vectors.text2VecOllama({ // Configure the Ollama embedding integration
          apiEndpoint: 'http://ollama:11434',
          model: 'nomic-embed-text',
        }),
        generative: generative.ollama({ // Configure the Ollama generative integration
          apiEndpoint: 'http://ollama:11434',
          model: 'llama3.2',
        }),
      });
      await loadQuestions(client);
    } else {
      console.log(`Collection "${testCollectionName}" already exists`);
    }
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

async function loadQuestions(client) {
  try {
    const data = await fs.readFile(path.join(__dirname, 'test-questions.json'), 'utf8');
    const jsonData = JSON.parse(data);
    const questions = client.collections.use(testCollectionName);
    const result = await questions.data.insertMany(jsonData);
    console.log(`${testCollectionName} insert response: `, result);
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

async function queryCollection(client) {
  try {
    const questions = client.collections.use(testCollectionName);
    const results = await Promise.all([
      questions.query.nearText('biology', { limit: 1 }),
      questions.query.nearText('animals', { limit: 1 }),
      questions.query.nearText('science', { limit: 3 }),
    ]);
    results.forEach(result => result.objects.forEach((item) => {
      console.log(JSON.stringify(item.properties, null, 2));
    }));
  } catch (error) {
    console.error('Error querying collection:', error);
  }
}