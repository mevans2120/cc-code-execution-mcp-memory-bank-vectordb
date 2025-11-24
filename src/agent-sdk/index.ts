/**
 * Agent SDK for Claude Code Vector DB
 *
 * This SDK provides a clean interface for AI agents to interact with the vector database
 * directly through code execution, bypassing the overhead of MCP tool calls.
 *
 * Usage in Code Mode:
 * ```typescript
 * import { ProjectVectorDB } from 'claude-code-vectordb/agent-sdk';
 * const db = new ProjectVectorDB();
 * await db.initialize();
 * const results = await db.query("authentication patterns", { limit: 5 });
 * ```
 *
 * This approach saves ~90% tokens compared to traditional tool calling.
 */

// Re-export the main client class and types
export { ProjectVectorDB } from '../lib/client';
export type {
  VectorDocument,
  DocumentMetadata,
  QueryResult,
  QueryOptions,
  CollectionStats,
  BackupData,
  VectorDBConfig,
  EmbeddingFunction,
} from '../lib/types';

// Re-export the embedding function for agents that need it
export { GoogleAIEmbeddingFunction } from '../lib/embeddings';

// Convenience function for quick initialization
export async function createVectorDB(config?: {
  chromaUrl?: string;
  collectionName?: string;
  apiKey?: string;
}) {
  const { GoogleAIEmbeddingFunction } = await import('../lib/embeddings');
  const { ProjectVectorDB } = await import('../lib/client');

  const embedder = new GoogleAIEmbeddingFunction(config?.apiKey);
  const db = new ProjectVectorDB({
    chromaUrl: config?.chromaUrl || 'http://localhost:8000',
    collectionName: config?.collectionName || 'project-docs',
    embeddingFunction: embedder,
  });

  await db.initialize();
  return db;
}

// Export a default configuration for agents
export const defaultConfig = {
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  collectionName: process.env.COLLECTION_NAME || 'project-docs',
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};