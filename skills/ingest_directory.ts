#!/usr/bin/env tsx
/**
 * Demonstration Skill: Ingest Directory
 *
 * This skill shows how an AI agent can use the Agent SDK to programmatically
 * ingest documentation from a directory into the vector database.
 *
 * Usage:
 *   tsx skills/ingest_directory.ts /path/to/docs
 *
 * This demonstrates the "Code Execution" pattern where an agent writes
 * and executes scripts instead of making individual tool calls.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createVectorDB } from '../src/agent-sdk';
import type { VectorDocument } from '../src/agent-sdk';

// Configuration
const SUPPORTED_EXTENSIONS = ['.md', '.mdx', '.txt'];
const CHUNK_SIZE = 1000; // Characters per chunk

/**
 * Recursively find all documentation files in a directory
 */
function findDocumentFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Split a document into chunks for better search results
 */
function chunkDocument(content: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Main ingestion function
 */
async function ingestDirectory(dirPath: string) {
  console.log(`🔍 Searching for documents in ${dirPath}...`);

  // Find all document files
  const files = findDocumentFiles(dirPath);
  console.log(`📄 Found ${files.length} document files`);

  if (files.length === 0) {
    console.log('❌ No documents found');
    return;
  }

  // Initialize vector database
  console.log('🚀 Initializing vector database...');
  const db = await createVectorDB();

  // Process each file
  const documents: VectorDocument[] = [];

  for (const filePath of files) {
    console.log(`📖 Processing ${path.basename(filePath)}...`);

    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkDocument(content, CHUNK_SIZE);

    // Create documents from chunks
    chunks.forEach((chunk, index) => {
      const docId = `${filePath}-chunk-${index}`;

      documents.push({
        id: docId,
        content: chunk,
        metadata: {
          source: 'ingested',
          filePath: filePath,
          title: path.basename(filePath),
          category: path.dirname(filePath).split(path.sep).pop() || 'general',
          chunkIndex: index,
          totalChunks: chunks.length,
          lastModified: fs.statSync(filePath).mtime.toISOString(),
        },
      });
    });
  }

  // Add documents to database
  console.log(`💾 Adding ${documents.length} document chunks to database...`);
  await db.addDocuments(documents);

  // Get statistics
  const stats = await db.getStats();
  console.log('\n✅ Ingestion complete!');
  console.log(`📊 Database statistics:`);
  console.log(`   Total documents: ${stats.totalDocuments}`);
  console.log(`   Categories: ${stats.categories.join(', ')}`);
  console.log(`   Sources: ${stats.sources.join(', ')}`);

  // Test with a sample query
  console.log('\n🔍 Testing with sample query...');
  const results = await db.query('architecture patterns', { limit: 3 });

  if (results.length > 0) {
    console.log(`Found ${results.length} relevant results:`);
    results.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.metadata.title} (score: ${result.score.toFixed(3)})`);
    });
  } else {
    console.log('No results found for test query');
  }
}

// Script execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: tsx skills/ingest_directory.ts /path/to/docs');
  process.exit(1);
}

const dirPath = path.resolve(args[0]);

if (!fs.existsSync(dirPath)) {
  console.error(`❌ Directory not found: ${dirPath}`);
  process.exit(1);
}

if (!fs.statSync(dirPath).isDirectory()) {
  console.error(`❌ Not a directory: ${dirPath}`);
  process.exit(1);
}

ingestDirectory(dirPath).catch((error) => {
  console.error('❌ Error during ingestion:', error);
  process.exit(1);
});