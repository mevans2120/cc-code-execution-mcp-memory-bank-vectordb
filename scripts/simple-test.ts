#!/usr/bin/env tsx
/**
 * Simplest possible test - let ChromaDB use its defaults
 */

import { ChromaClient } from 'chromadb';

async function simpleTest() {
  const client = new ChromaClient();

  // Just use defaults - no custom embedding function
  const collection = await client.getOrCreateCollection({
    name: 'simple-test'
  });

  // Add a document
  await collection.add({
    ids: ['doc1'],
    documents: ['This is about authentication and security patterns for JWT tokens'],
  });

  console.log('✅ Document added');

  // Query it
  const results = await collection.query({
    queryTexts: ['authentication'],
    nResults: 1
  });

  console.log('✅ Query worked!');
  console.log('Results:', results.documents[0]);

  // Clean up
  await client.deleteCollection({ name: 'simple-test' });
}

simpleTest().catch(console.error);