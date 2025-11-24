#!/usr/bin/env node
/**
 * MCP Server for Claude Code Vector Database
 * 
 * This server exposes the vector database functionality via the Model Context Protocol,
 * allowing AI agents to query project documentation semantically.
 * 
 * Usage:
 *   npm run mcp:dev
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ProjectVectorDB } from '../lib/client.js';
import { GoogleAIEmbeddingFunction } from '../lib/embeddings.js';
import type { QueryOptions } from '../lib/types.js';

// Initialize vector DB client
const embedder = new GoogleAIEmbeddingFunction();
const vectorDB = new ProjectVectorDB({
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  collectionName: process.env.COLLECTION_NAME || 'project-docs',
  embeddingFunction: embedder,
});

// Initialize on startup
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await vectorDB.initialize();
    isInitialized = true;
  }
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'search_tools',
    description: 'Search for available tools by keyword. Use this to discover specific capabilities without loading all tool definitions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant tools',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_vector_db',
    description: 'Semantic search across project documentation. Returns relevant documentation chunks based on natural language queries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language question or search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5,
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.7)',
          default: 0.7,
        },
        category: {
          type: 'string',
          description: 'Filter by category (e.g., architecture, chatbot, design)',
        },
        source: {
          type: 'string',
          description: 'Filter by source (e.g., docs, memory-bank, claude-md)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_by_category',
    description: 'Search within a specific documentation category',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category to search within',
        },
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 5,
        },
      },
      required: ['category', 'query'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get statistics about the vector database collection',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_recent_docs',
    description: 'Get recently modified documents',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back (default: 7)',
          default: 7,
        },
      },
    },
  },
  {
    name: 'add_documents',
    description: 'Add new documents to the vector database',
    inputSchema: {
      type: 'object',
      properties: {
        documents: {
          type: 'array',
          description: 'Array of documents to add',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              metadata: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  category: { type: 'string' },
                  filePath: { type: 'string' },
                  title: { type: 'string' },
                },
                required: ['source'],
              },
            },
            required: ['id', 'content', 'metadata'],
          },
        },
      },
      required: ['documents'],
    },
  },
  {
    name: 'backup_database',
    description: 'Export the entire vector database to a backup file',
    inputSchema: {
      type: 'object',
      properties: {
        outputPath: {
          type: 'string',
          description: 'Path where the backup file should be saved (e.g., ./backups/vectordb-backup.jsonl)',
        },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'restore_database',
    description: 'Restore the vector database from a backup file',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: {
          type: 'string',
          description: 'Path to the backup file to restore from',
        },
        clearExisting: {
          type: 'boolean',
          description: 'Whether to clear existing data before restoring (default: false)',
          default: false,
        },
      },
      required: ['inputPath'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'claude-code-vectordb',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await ensureInitialized();

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_vector_db': {
        const { query, limit, threshold, category, source } = args as {
          query: string;
          limit?: number;
          threshold?: number;
          category?: string;
          source?: string;
        };

        const options: QueryOptions = {
          limit,
          threshold,
          category,
          source,
        };

        const results = await vectorDB.query(query, options);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  resultCount: results.length,
                  results: results.map((r) => ({
                    score: r.score,
                    title: r.metadata.title,
                    category: r.metadata.category,
                    source: r.metadata.source,
                    filePath: r.metadata.filePath,
                    content: r.content,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'search_by_category': {
        const { category, query, limit } = args as {
          category: string;
          query: string;
          limit?: number;
        };

        const results = await vectorDB.searchByCategory(category, query, {
          limit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  category,
                  query,
                  resultCount: results.length,
                  results: results.map((r) => ({
                    score: r.score,
                    title: r.metadata.title,
                    content: r.content,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_stats': {
        const stats = await vectorDB.getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case 'get_recent_docs': {
        const { days = 7 } = args as { days?: number };
        const docs = await vectorDB.getRecentDocs(days);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  days,
                  count: docs.length,
                  documents: docs.map((d) => ({
                    title: d.metadata.title,
                    source: d.metadata.source,
                    category: d.metadata.category,
                    lastModified: d.metadata.lastModified,
                    filePath: d.metadata.filePath,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_documents': {
        const { documents } = args as { documents: any[] };
        await vectorDB.addDocuments(documents);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                added: documents.length,
              }),
            },
          ],
        };
      }

      case 'search_tools': {
        const { query } = args as { query: string };
        const lowerQuery = query.toLowerCase();

        const matchingTools = tools.filter(t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          (t.description && t.description.toLowerCase().includes(lowerQuery))
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                count: matchingTools.length,
                tools: matchingTools.map(t => ({
                  name: t.name,
                  description: t.description,
                  // We omit the full inputSchema to save tokens, as per the research
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'backup_database': {
        const { outputPath } = args as { outputPath: string };
        await vectorDB.exportBackup(outputPath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Database backed up to ${outputPath}`,
                path: outputPath,
              }, null, 2),
            },
          ],
        };
      }

      case 'restore_database': {
        const { inputPath, clearExisting = false } = args as {
          inputPath: string;
          clearExisting?: boolean;
        };
        await vectorDB.importBackup(inputPath, clearExisting);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Database restored from ${inputPath}`,
                clearExisting,
                path: inputPath,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: errorMessage,
            tool: name,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Claude Code Vector DB MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
