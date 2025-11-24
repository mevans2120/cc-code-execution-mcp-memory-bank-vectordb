#!/usr/bin/env tsx
/**
 * Ingest documentation using default embeddings
 */

import { ChromaClient } from 'chromadb';
import * as fs from 'fs';
import * as path from 'path';

async function ingestWithDefaults() {
  console.log('📚 Ingesting documentation with default embeddings\n');

  const client = new ChromaClient();

  // Create collection with default embeddings
  const collection = await client.getOrCreateCollection({
    name: 'project-docs'
  });

  // Read all markdown files from docs
  const docsDir = './docs';
  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

  console.log(`Found ${files.length} documentation files\n`);

  let totalChunks = 0;
  const documents: string[] = [];
  const ids: string[] = [];
  const metadatas: any[] = [];

  for (const file of files) {
    console.log(`📖 Processing ${file}...`);
    const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');

    // Simple chunking - split by double newline
    const chunks = content.split('\n\n').filter(chunk => chunk.trim().length > 50);

    chunks.forEach((chunk, i) => {
      const id = `${file}-chunk-${i}`;
      ids.push(id);
      documents.push(chunk);
      metadatas.push({
        source: 'docs',
        filePath: `docs/${file}`,
        title: file.replace('.md', ''),
        chunkIndex: i,
        totalChunks: chunks.length
      });
      totalChunks++;
    });
  }

  console.log(`\n💾 Adding ${totalChunks} chunks to database...`);

  // Add in batches to avoid issues
  const batchSize = 20;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = {
      ids: ids.slice(i, i + batchSize),
      documents: documents.slice(i, i + batchSize),
      metadatas: metadatas.slice(i, i + batchSize)
    };

    await collection.add(batch);
    console.log(`   Added batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ids.length/batchSize)}`);
  }

  const count = await collection.count();
  console.log(`\n✅ Ingestion complete! Total documents: ${count}`);

  // Test a query
  console.log('\n🧪 Testing search...');
  const results = await collection.query({
    queryTexts: ['vector database'],
    nResults: 2
  });

  if (results.documents[0]?.length > 0) {
    console.log(`✅ Search works! Found ${results.documents[0].length} results`);
    results.documents[0].forEach((doc, i) => {
      const metadata = results.metadatas[0][i];
      console.log(`   - ${metadata.title}: "${doc.substring(0, 80)}..."`);
    });
  }
}

ingestWithDefaults().catch(console.error);