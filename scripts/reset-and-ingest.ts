#!/usr/bin/env tsx
/**
 * Reset the collection and reingest with proper embeddings
 */

import { ChromaClient } from 'chromadb';
import { GoogleAIEmbeddingFunction } from '../src/lib/embeddings.js';

async function resetAndReingest() {
  console.log('🔄 Resetting and reingesting with proper embeddings\n');

  // Set API key
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'AIzaSyDQUM9sBZiExzUFeVZONPGFyS2TR4WEIPY';

  // Create embedding function
  const embedder = new GoogleAIEmbeddingFunction();

  // Connect to ChromaDB
  const client = new ChromaClient();

  // Delete old collection if it exists
  try {
    await client.deleteCollection({ name: 'project-docs' });
    console.log('✅ Deleted old collection\n');
  } catch (e) {
    console.log('ℹ️  No existing collection to delete\n');
  }

  // Now run the ingestion script
  console.log('📚 Running ingestion with proper embeddings...\n');
  const { ingestDirectory } = await import('../skills/ingest_directory.js');

  // The ingestion will create the collection with proper embeddings
  await ingestDirectory('./docs');
}

resetAndReingest().catch(console.error);