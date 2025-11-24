#!/usr/bin/env node
/**
 * CLI for Claude Code Vector Database
 * 
 * Command-line interface for querying and managing the vector database.
 * 
 * Usage:
 *   vectordb query "How does the styling system work?"
 *   vectordb stats
 *   vectordb recent 7
 *   vectordb clear
 *   vectordb backup ./backup.jsonl
 *   vectordb restore ./backup.jsonl
 */

import { Command } from 'commander';
import { ProjectVectorDB } from '../src/lib/client.js';
import { GoogleAIEmbeddingFunction } from '../src/lib/embeddings.js';
import * as readline from 'readline';

const program = new Command();

// Initialize vector DB
async function getVectorDB() {
    const embedder = new GoogleAIEmbeddingFunction();
    const vectorDB = new ProjectVectorDB({
        chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
        collectionName: process.env.COLLECTION_NAME || 'project-docs',
        embeddingFunction: embedder,
    });
    await vectorDB.initialize();
    return vectorDB;
}

program
    .name('vectordb')
    .description('CLI for Claude Code Vector Database')
    .version('1.0.0');

// Query command
program
    .command('query')
    .description('Search the vector database with a natural language query')
    .argument('<text>', 'Search query')
    .option('-l, --limit <number>', 'Maximum number of results', '5')
    .option('-t, --threshold <number>', 'Minimum similarity threshold (0-1)', '0.7')
    .option('-c, --category <category>', 'Filter by category')
    .option('-s, --source <source>', 'Filter by source')
    .action(async (text, options) => {
        try {
            const vectorDB = await getVectorDB();

            const results = await vectorDB.query(text, {
                limit: parseInt(options.limit),
                threshold: parseFloat(options.threshold),
                category: options.category,
                source: options.source,
            });

            console.log(`\n🔍 Query: "${text}"\n`);
            console.log(`Found ${results.length} results:\n`);

            results.forEach((result, i) => {
                console.log(`${i + 1}. Score: ${result.score.toFixed(3)} | ${result.metadata.title}`);
                console.log(`   Category: ${result.metadata.category} | Source: ${result.metadata.source}`);
                console.log(`   File: ${result.metadata.filePath}`);
                console.log(`   Content: ${result.content.substring(0, 150)}...`);
                console.log();
            });
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Stats command
program
    .command('stats')
    .description('Show collection statistics')
    .action(async () => {
        try {
            const vectorDB = await getVectorDB();
            const stats = await vectorDB.getStats();

            console.log('\n📊 Collection Statistics:\n');
            console.log(`Total documents: ${stats.totalDocuments}`);
            console.log(`Average chunk size: ${stats.averageChunkSize} chars`);
            console.log(`Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`);

            console.log('\n📂 Categories:');
            Object.entries(stats.categories)
                .sort(([, a], [, b]) => b - a)
                .forEach(([cat, count]) => {
                    console.log(`  ${cat}: ${count} chunks`);
                });

            console.log('\n📝 Sources:');
            Object.entries(stats.sources)
                .sort(([, a], [, b]) => b - a)
                .forEach(([src, count]) => {
                    console.log(`  ${src}: ${count} chunks`);
                });
            console.log();
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Recent command
program
    .command('recent')
    .description('Show recently modified documents')
    .argument('[days]', 'Number of days to look back', '7')
    .action(async (days) => {
        try {
            const vectorDB = await getVectorDB();
            const docs = await vectorDB.getRecentDocs(parseInt(days));

            console.log(`\n📅 Documents modified in the last ${days} days:\n`);
            console.log(`Found ${docs.length} documents:\n`);

            docs.forEach((doc, i) => {
                console.log(`${i + 1}. ${doc.metadata.title}`);
                console.log(`   Source: ${doc.metadata.source} | Category: ${doc.metadata.category}`);
                console.log(`   File: ${doc.metadata.filePath}`);
                console.log(`   Modified: ${new Date(doc.metadata.lastModified || '').toLocaleString()}`);
                console.log();
            });
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Clear command
program
    .command('clear')
    .description('Clear all documents from the collection')
    .action(async () => {
        try {
            // Prompt for confirmation
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question('⚠️  Are you sure you want to clear the entire collection? (yes/no): ', async (answer) => {
                rl.close();

                if (answer.toLowerCase() !== 'yes') {
                    console.log('Operation cancelled.');
                    return;
                }

                const vectorDB = await getVectorDB();
                await vectorDB.clearCollection(true);
                console.log('✅ Collection cleared successfully.');
            });
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Backup command
program
    .command('backup')
    .description('Export collection to a backup file')
    .argument('<path>', 'Output file path (e.g., ./backup.jsonl)')
    .action(async (path) => {
        try {
            const vectorDB = await getVectorDB();
            await vectorDB.exportBackup(path);
            console.log(`✅ Backup exported to ${path}`);
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

// Restore command
program
    .command('restore')
    .description('Import collection from a backup file')
    .argument('<path>', 'Input file path (e.g., ./backup.jsonl)')
    .option('--clear', 'Clear existing collection before restoring')
    .action(async (path, options) => {
        try {
            const vectorDB = await getVectorDB();
            await vectorDB.importBackup(path, options.clear || false);
            console.log('✅ Backup restored successfully.');
        } catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();
