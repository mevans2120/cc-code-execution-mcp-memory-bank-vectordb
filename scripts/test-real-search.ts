#!/usr/bin/env tsx
/**
 * Test searching the real documentation
 */

import { ChromaClient } from 'chromadb';

async function testRealSearch() {
  console.log('🔍 Testing Real Documentation Search\n');

  const client = new ChromaClient();

  // Get the actual collection with our docs
  const collection = await client.getOrCreateCollection({
    name: 'project-docs'
  });

  const count = await collection.count();
  console.log(`📚 Database has ${count} documents\n`);

  // Test searches on our actual documentation
  const searches = [
    'agent skill implementation',
    'vector database',
    'token reduction',
    'MCP server',
    'repository management'
  ];

  for (const query of searches) {
    console.log(`\n📝 Searching for: "${query}"`);
    console.log('----------------------------');

    try {
      const results = await collection.query({
        queryTexts: [query],
        nResults: 2
      });

      if (results.documents[0]?.length > 0) {
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas[0][i];
          console.log(`\n${i + 1}. ${metadata?.title || 'Document'}`);
          console.log(`   File: ${metadata?.filePath || 'unknown'}`);
          console.log(`   Preview: ${doc?.substring(0, 100)}...`);
        });
      } else {
        console.log('   No results found');
      }
    } catch (e) {
      console.log(`   Error: ${e}`);
    }
  }
}

testRealSearch().catch(console.error);