#!/usr/bin/env tsx
/**
 * Debug ChromaDB connection issue
 */

import { ChromaClient } from 'chromadb';

async function debugConnection() {
  console.log('🔍 Debugging ChromaDB Connection\n');

  // Test 1: Basic connection
  console.log('Test 1: Basic client creation');
  try {
    const client1 = new ChromaClient();
    console.log('✅ Default client works\n');
  } catch (e) {
    console.log('❌ Default client failed:', e, '\n');
  }

  // Test 2: With host/port
  console.log('Test 2: Client with host/port');
  try {
    const client2 = new ChromaClient({
      host: 'localhost',
      port: 8000,
      ssl: false
    });
    console.log('✅ Host/port client works\n');
  } catch (e) {
    console.log('❌ Host/port client failed:', e, '\n');
  }

  // Test 3: List collections (no embedding needed)
  console.log('Test 3: List collections');
  try {
    const client = new ChromaClient();
    const collections = await client.listCollections();
    console.log(`✅ Listed ${collections.length} collections\n`);
  } catch (e) {
    console.log('❌ List collections failed:', e, '\n');
  }

  // Test 4: Get or create without embedding
  console.log('Test 4: GetOrCreate without embedding function');
  try {
    const client = new ChromaClient();
    const collection = await client.getOrCreateCollection({
      name: 'test-collection'
    });
    console.log('✅ Collection created without embedding\n');

    // Clean up
    await client.deleteCollection({ name: 'test-collection' });
  } catch (e) {
    console.log('❌ GetOrCreate without embedding failed:', e, '\n');
  }

  // Test 5: With Google embedding
  console.log('Test 5: With Google embedding function');
  try {
    const { GoogleAIEmbeddingFunction } = await import('../src/lib/embeddings.js');
    const embedder = new GoogleAIEmbeddingFunction();

    const client = new ChromaClient();
    const collection = await client.getOrCreateCollection({
      name: 'test-with-embedding',
      embeddingFunction: embedder
    });
    console.log('✅ Collection created with Google embedding\n');

    // Clean up
    await client.deleteCollection({ name: 'test-with-embedding' });
  } catch (e) {
    console.log('❌ With Google embedding failed:', e, '\n');
  }
}

// Set API key and run
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyDQUM9sBZiExzUFeVZONPGFyS2TR4WEIPY';
debugConnection();