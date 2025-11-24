#!/usr/bin/env tsx
/**
 * Initialize Vector Database for First Use
 *
 * This script sets up the database with initial test data
 * and ensures it's ready for the agent skill to use.
 */

import { ProjectVectorDB } from '../src/lib/client.js';
import { GoogleAIEmbeddingFunction } from '../src/lib/embeddings.js';
import * as fs from 'fs';
import * as path from 'path';

async function initializeDB() {
  console.log('🚀 Initializing Vector Database\n');

  try {
    // Try to create embedding function
    let embedder;
    try {
      embedder = new GoogleAIEmbeddingFunction();
      console.log('✅ Using Google AI embeddings');
    } catch (error) {
      console.log('⚠️  No Google AI API key found');
      console.log('   Set GOOGLE_GENERATIVE_AI_API_KEY environment variable');
      console.log('   Proceeding without embeddings (limited functionality)');
      // For now, we'll create a dummy embedder
      embedder = {
        embed: async (texts: string[]) => {
          // Return random embeddings for testing
          return texts.map(() => Array(768).fill(0).map(() => Math.random()));
        }
      };
    }

    // Initialize the vector DB
    const db = new ProjectVectorDB({
      chromaUrl: 'http://localhost:8000',
      collectionName: 'project-docs',
      embeddingFunction: embedder as any,
    });

    await db.initialize();
    console.log('✅ Database initialized');

    // Check current state
    const stats = await db.getStats();
    console.log(`\n📊 Current Status:`);
    console.log(`   Documents: ${stats.totalDocuments}`);
    console.log(`   Categories: ${stats.categories.join(', ') || 'none'}`);

    // Add some initial test documents if empty
    if (stats.totalDocuments === 0) {
      console.log('\n📝 Adding initial documentation...');

      const initialDocs = [
        {
          id: 'pattern-auth-1',
          content: `Authentication Pattern: JWT Token Implementation

          Use JWT tokens for stateless authentication. Store refresh tokens securely.
          Implement token rotation for enhanced security. Always validate tokens on
          the backend. Use proper expiration times (15 min for access, 7 days for refresh).`,
          metadata: {
            source: 'patterns',
            category: 'authentication',
            title: 'JWT Authentication Pattern',
            filePath: 'docs/patterns/auth.md',
            lastModified: new Date().toISOString(),
          }
        },
        {
          id: 'pattern-error-1',
          content: `Error Handling Pattern: Global Error Boundary

          Implement a global error boundary in React applications. Catch errors at
          the component tree level. Log errors to monitoring service. Display
          user-friendly error messages. Provide recovery options when possible.`,
          metadata: {
            source: 'patterns',
            category: 'error-handling',
            title: 'React Error Boundary Pattern',
            filePath: 'docs/patterns/errors.md',
            lastModified: new Date().toISOString(),
          }
        },
        {
          id: 'pattern-api-1',
          content: `API Design Pattern: RESTful Resource Naming

          Use plural nouns for collections (/users, /posts). Use kebab-case for
          multi-word resources. Include version in URL (/api/v1/). Use proper
          HTTP methods (GET, POST, PUT, DELETE). Return consistent response formats.`,
          metadata: {
            source: 'patterns',
            category: 'api-design',
            title: 'REST API Naming Conventions',
            filePath: 'docs/patterns/api.md',
            lastModified: new Date().toISOString(),
          }
        },
        {
          id: 'pattern-db-1',
          content: `Database Pattern: Repository Pattern Implementation

          Abstract database operations behind repository interfaces. Separate
          business logic from data access. Use dependency injection for repositories.
          Implement unit of work pattern for transactions. Cache frequently accessed data.`,
          metadata: {
            source: 'patterns',
            category: 'database',
            title: 'Repository Pattern',
            filePath: 'docs/patterns/database.md',
            lastModified: new Date().toISOString(),
          }
        },
        {
          id: 'convention-naming-1',
          content: `Naming Conventions: Project Standards

          Components: PascalCase (UserProfile, NavigationBar)
          Functions: camelCase (getUserData, handleSubmit)
          Constants: UPPER_SNAKE_CASE (API_URL, MAX_RETRIES)
          Files: kebab-case (user-profile.tsx, api-client.ts)
          CSS classes: kebab-case (nav-bar, user-avatar)`,
          metadata: {
            source: 'conventions',
            category: 'standards',
            title: 'Naming Conventions',
            filePath: 'docs/conventions/naming.md',
            lastModified: new Date().toISOString(),
          }
        }
      ];

      await db.addDocuments(initialDocs);
      console.log(`✅ Added ${initialDocs.length} initial documents`);

      // Test a query
      console.log('\n🧪 Testing search functionality...');
      const results = await db.query('authentication', { limit: 2 });
      console.log(`   Found ${results.length} results for "authentication"`);
      if (results.length > 0) {
        console.log(`   Top result: ${results[0].metadata.title} (score: ${results[0].score.toFixed(3)})`);
      }
    }

    // Final status
    const finalStats = await db.getStats();
    console.log('\n✅ Database Ready!');
    console.log('================================');
    console.log(`📄 Total documents: ${finalStats.totalDocuments}`);
    console.log(`📁 Categories: ${finalStats.categories.join(', ')}`);
    console.log(`📂 Sources: ${finalStats.sources.join(', ')}`);
    console.log('\n🎯 The agent skill can now use the vector database');
    console.log('   Try: "search for authentication patterns"');

  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure ChromaDB is running: npm run chromadb:start');
    console.log('2. Check port 8000 is available');
    console.log('3. Optional: Set GOOGLE_GENERATIVE_AI_API_KEY for better results');
    process.exit(1);
  }
}

// Run initialization
initializeDB();