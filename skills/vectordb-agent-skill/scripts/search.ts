#!/usr/bin/env tsx
/**
 * Vector DB Search Script for Agent Skill
 *
 * This script is called by the agent skill to search the vector database.
 * Usage: tsx search.ts "search terms"
 */

import { ChromaClient } from 'chromadb';

interface SearchOptions {
  query: string;
  limit?: number;
  category?: string;
  threshold?: number;
}

/**
 * Expand query with synonyms and related terms
 */
function expandQuery(query: string): string[] {
  const terms = [query];

  // Common technical expansions
  const expansions: Record<string, string[]> = {
    'auth': ['authentication', 'authorization', 'login', 'security'],
    'db': ['database', 'schema', 'model', 'repository'],
    'api': ['endpoint', 'REST', 'GraphQL', 'service'],
    'ui': ['component', 'interface', 'frontend', 'view'],
    'test': ['testing', 'spec', 'unit test', 'integration test'],
  };

  // Add expansions for any matching terms
  const lowerQuery = query.toLowerCase();
  for (const [key, values] of Object.entries(expansions)) {
    if (lowerQuery.includes(key)) {
      terms.push(...values);
    }
  }

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Format search results for display
 */
function formatResults(results: any): string {
  if (!results.documents?.[0]?.length) {
    return 'No relevant patterns found in the vector database.';
  }

  let output = `Found ${results.documents[0].length} relevant results:\n\n`;

  results.documents[0].forEach((doc: string, i: number) => {
    const metadata = results.metadatas?.[0]?.[i] || {};
    const distance = results.distances?.[0]?.[i];
    const score = distance ? (1 - distance).toFixed(3) : 'N/A';

    output += `${i + 1}. **${metadata.title || 'Untitled'}** (relevance: ${score})\n`;
    output += `   Category: ${metadata.category || 'general'}\n`;
    output += `   Source: ${metadata.source || 'unknown'}\n`;

    if (metadata.filePath) {
      output += `   File: ${metadata.filePath}\n`;
    }

    // Show preview (first 200 chars)
    if (doc) {
      const preview = doc.substring(0, 200).replace(/\n/g, ' ');
      output += `   Preview: ${preview}...\n`;
    }

    output += '\n';
  });

  return output;
}

/**
 * Main search function
 */
async function searchVectorDB(options: SearchOptions): Promise<string> {
  try {
    // Connect to ChromaDB
    const client = new ChromaClient({
      host: 'localhost',
      port: 8000,
      ssl: false
    });

    // Get the collection
    const collection = await client.getCollection({
      name: process.env.COLLECTION_NAME || 'project-docs'
    });

    // Expand the query
    const queryTexts = expandQuery(options.query);

    // Build where clause if category specified
    const whereClause = options.category
      ? { category: { $eq: options.category } }
      : undefined;

    // Perform the search
    const results = await collection.query({
      queryTexts,
      nResults: options.limit || 5,
      where: whereClause,
    });

    // Format and return results
    return formatResults(results);

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        return `❌ Cannot connect to vector database. Please ensure ChromaDB is running:

cd ~/claude-code-vectordb
npm run chromadb:start`;
      }
      return `❌ Search error: ${error.message}`;
    }
    return '❌ Unknown error occurred during search';
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsx search.ts "search terms" [limit] [category]');
    process.exit(1);
  }

  return {
    query: args[0],
    limit: args[1] ? parseInt(args[1], 10) : 5,
    category: args[2],
    threshold: 0.7,
  };
}

// Execute if run directly
if (require.main === module) {
  const options = parseArgs();

  searchVectorDB(options)
    .then(results => {
      console.log(results);
    })
    .catch(error => {
      console.error('Failed to search:', error);
      process.exit(1);
    });
}