#!/usr/bin/env tsx
/**
 * Content Audit Script for Vector Database
 *
 * Analyzes the current state of the vector database to identify:
 * - Total documents
 * - Categories and distribution
 * - Quality metrics
 * - Recent vs outdated content
 */

import { ChromaClient } from 'chromadb';

async function auditContent() {
  console.log('🔍 Vector Database Content Audit\n');
  console.log('================================\n');

  try {
    // Connect to ChromaDB
    const client = new ChromaClient({
      host: 'localhost',
      port: 8000,
      ssl: false
    });

    // List all collections
    const collections = await client.listCollections();
    console.log(`📚 Collections found: ${collections.length}`);

    if (collections.length === 0) {
      console.log('❌ No collections found. Database is empty.');
      console.log('\nRecommendation: Run ingestion script to populate the database.');
      return;
    }

    for (const collectionInfo of collections) {
      console.log(`\n📁 Collection: ${collectionInfo.name}`);
      console.log('----------------------------');

      // Get the collection
      const collection = await client.getCollection({ name: collectionInfo.name });

      // Get all documents (for audit purposes)
      const allDocs = await collection.get();

      const totalDocs = allDocs.ids.length;
      console.log(`📄 Total documents: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log('   ⚠️  Collection is empty');
        continue;
      }

      // Analyze metadata
      const categories = new Map<string, number>();
      const sources = new Map<string, number>();
      const dates: Date[] = [];

      allDocs.metadatas?.forEach((metadata: any) => {
        // Count categories
        if (metadata?.category) {
          categories.set(metadata.category, (categories.get(metadata.category) || 0) + 1);
        }

        // Count sources
        if (metadata?.source) {
          sources.set(metadata.source, (sources.get(metadata.source) || 0) + 1);
        }

        // Track dates
        if (metadata?.lastModified) {
          dates.push(new Date(metadata.lastModified));
        }
      });

      // Display category distribution
      console.log('\n📊 Category Distribution:');
      if (categories.size === 0) {
        console.log('   ⚠️  No categories found');
      } else {
        const sortedCategories = Array.from(categories.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        sortedCategories.forEach(([cat, count]) => {
          const percentage = ((count / totalDocs) * 100).toFixed(1);
          console.log(`   - ${cat}: ${count} docs (${percentage}%)`);
        });
      }

      // Display source distribution
      console.log('\n📂 Source Distribution:');
      if (sources.size === 0) {
        console.log('   ⚠️  No sources found');
      } else {
        const sortedSources = Array.from(sources.entries())
          .sort((a, b) => b[1] - a[1]);

        sortedSources.forEach(([source, count]) => {
          const percentage = ((count / totalDocs) * 100).toFixed(1);
          console.log(`   - ${source}: ${count} docs (${percentage}%)`);
        });
      }

      // Analyze recency
      if (dates.length > 0) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

        const recent = dates.filter(d => d > oneWeekAgo).length;
        const lastMonth = dates.filter(d => d > oneMonthAgo).length;
        const old = dates.filter(d => d < sixMonthsAgo).length;

        console.log('\n📅 Content Freshness:');
        console.log(`   - Last week: ${recent} docs`);
        console.log(`   - Last month: ${lastMonth} docs`);
        console.log(`   - Older than 6 months: ${old} docs`);
      }

      // Test query quality
      console.log('\n🧪 Sample Query Tests:');
      const testQueries = [
        'authentication',
        'error handling',
        'database schema',
        'api design',
        'testing patterns'
      ];

      for (const query of testQueries) {
        const results = await collection.query({
          queryTexts: [query],
          nResults: 3
        });

        const resultCount = results.ids[0]?.length || 0;
        const avgDistance = results.distances?.[0]
          ? (results.distances[0].reduce((a, b) => a + b, 0) / results.distances[0].length).toFixed(3)
          : 'N/A';

        console.log(`   - "${query}": ${resultCount} results (avg distance: ${avgDistance})`);
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('----------------------------');

    if (collections.length === 0) {
      console.log('1. ❗ Initialize the database with: tsx skills/ingest_directory.ts /path/to/docs');
      console.log('2. ❗ Create the project-docs collection');
      console.log('3. ❗ Index your project documentation');
    } else {
      console.log('1. ✅ Database is operational');
      console.log('2. 📝 Consider adding more recent documentation');
      console.log('3. 🔧 Review and categorize uncategorized documents');
      console.log('4. 🎯 Test queries match expected patterns');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure ChromaDB is running: npm run chromadb:start');
    console.log('2. Check connection: curl http://localhost:8000');
    console.log('3. Verify port 8000 is not blocked');
  }
}

// Run the audit
auditContent()
  .then(() => {
    console.log('\n✅ Audit complete');
  })
  .catch(error => {
    console.error('Failed to complete audit:', error);
    process.exit(1);
  });