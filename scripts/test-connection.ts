#!/usr/bin/env tsx
/**
 * Simple connection test for ChromaDB
 */

import { ChromaClient } from 'chromadb';
import { GoogleAIEmbeddingFunction } from '../src/lib/embeddings.js';

async function testConnection() {
  console.log('Testing ChromaDB connection...\n');

  try {
    const client = new ChromaClient();
    console.log('✅ Client created');

    // Create embedding function if API key available
    let embeddingFunction;
    try {
      embeddingFunction = new GoogleAIEmbeddingFunction();
      console.log('✅ Using Google AI embeddings');
    } catch {
      console.log('⚠️  No Google AI API key, using default embeddings');
    }

    // Try to get or create a collection
    const collection = await client.getOrCreateCollection({
      name: 'project-docs',
      embeddingFunction
    });
    console.log(`✅ Collection 'project-docs' ready`);

    // Get collection count
    const count = await collection.count();
    console.log(`📄 Documents in collection: ${count}`);

    // Try a simple add if empty
    if (count === 0) {
      console.log('\nAdding test document...');
      await collection.add({
        ids: ['test-doc'],
        documents: ['This is a test document for vector database connection testing'],
        metadatas: [{
          source: 'test',
          category: 'test',
          title: 'Test Document'
        }]
      });
      console.log('✅ Test document added');
    }

    // Test a query
    console.log('\nTesting query...');
    const results = await collection.query({
      queryTexts: ['test'],
      nResults: 1
    });
    console.log(`✅ Query successful, found ${results.ids[0].length} results`);

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection();