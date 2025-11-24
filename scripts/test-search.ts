#!/usr/bin/env tsx
/**
 * Test vector database search functionality
 */

import { ChromaClient } from 'chromadb';
import { GoogleAIEmbeddingFunction } from '../src/lib/embeddings.js';

async function testSearch() {
  console.log('🔍 Testing Vector DB Search\n');

  // Set up embedding function
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyDQUM9sBZiExzUFeVZONPGFyS2TR4WEIPY';
  const embedder = new GoogleAIEmbeddingFunction();

  // Connect to ChromaDB
  const client = new ChromaClient();
  const collection = await client.getOrCreateCollection({
    name: 'project-docs',
    embeddingFunction: embedder
  });

  // Test searches
  const searches = [
    'agent skill implementation',
    'token reduction',
    'ChromaDB setup',
    'authentication patterns',
    'vector database'
  ];

  for (const query of searches) {
    console.log(`\n📝 Searching for: "${query}"`);
    console.log('----------------------------');

    const results = await collection.query({
      queryTexts: [query],
      nResults: 3
    });

    if (results.documents[0].length > 0) {
      results.documents[0].forEach((doc, i) => {
        const metadata = results.metadatas[0][i];
        const distance = results.distances[0][i];
        const score = (1 - distance).toFixed(3);

        console.log(`\n${i + 1}. Score: ${score}`);
        console.log(`   File: ${metadata.filePath}`);
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Preview: ${doc.substring(0, 150)}...`);
      });
    } else {
      console.log('   No results found');
    }
  }

  // Get total count
  const count = await collection.count();
  console.log(`\n\n✅ Database contains ${count} documents`);
}

testSearch().catch(console.error);