# Vector Database Usage Guide

## Overview

The Claude Code Vector DB is designed to work via **code execution pattern**, not traditional tool calling. This provides a 90% reduction in token usage compared to MCP tool calling.

## Architecture

The system is structured as:
- **MCP server** with a **code execution sandbox** in front of it
- Agents interact by executing TypeScript code directly in the project directory
- ChromaDB as the vector storage backend
- Optional Google AI embeddings (text-embedding-004) or default embeddings

## Usage Patterns

### 1. Code Execution Pattern (Recommended)

This is how the system is designed to be used by AI agents:

```typescript
// Execute directly in project directory
cd ~/claude-code-vectordb && npx tsx -e "
import { ChromaClient } from 'chromadb';
const client = new ChromaClient();
const collection = await client.getOrCreateCollection({ name: 'project-docs' });
const results = await collection.query({
  queryTexts: ['your search query'],
  nResults: 3
});
console.log(results.documents[0]);
"
```

### 2. Test Scripts

The `scripts/` directory contains various test utilities:

- **simple-test.ts** - Basic ChromaDB functionality test with defaults
- **ingest-with-defaults.ts** - Ingest docs using default embeddings
- **test-real-search.ts** - Search the ingested documentation
- **test-search.ts** - Search with Google AI embeddings
- **reset-and-ingest.ts** - Reset DB and reingest with Google AI embeddings

### 3. Agent SDK

For more complex operations, use the Agent SDK:

```typescript
import { ProjectVectorDB } from './src/agent-sdk';

const db = new ProjectVectorDB({
  chromaUrl: 'http://localhost:8000',
  collectionName: 'project-docs'
});

await db.connect();
const results = await db.search('query text', 5);
```

## Embedding Types

### Default Embeddings
- No API key required
- Fast and simple
- Good for basic semantic search
- Used by `ingest-with-defaults.ts`

### Google AI Embeddings (text-embedding-004)
- Requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env`
- Higher quality semantic matching
- Used by `test-search.ts` and `reset-and-ingest.ts`

**Important**: Collections must be created and queried with the same embedding type. Mixing embedding types will cause errors.

## Cross-Project Usage

To use the vector DB in other projects:

### Option 1: Symbolic Link (Recommended for Development)
```bash
ln -s ~/claude-code-vectordb ~/your-project/vectordb
```

Then in your project:
```typescript
cd ~/your-project && npx tsx -e "
import { ChromaClient } from './vectordb/node_modules/chromadb';
// ... rest of code
"
```

### Option 2: Direct Path Access
```typescript
cd ~/claude-code-vectordb && npx tsx -e "
// Your search code here
"
```

## Security Notes

- **Never hardcode API keys** - Always use `.env` files
- Scripts must import `'dotenv/config'` to load environment variables
- The `.env` file should contain:
  ```
  GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
  CHROMADB_URL=http://localhost:8000
  COLLECTION_NAME=project-docs
  ```

## Common Issues

### Error: 422 Unprocessable Entity
- **Cause**: Embedding type mismatch between creation and query
- **Solution**: Reset the collection and ensure consistent embedding type

### Error: MODULE_NOT_FOUND for dotenv
- **Cause**: dotenv package not installed
- **Solution**: Run `npm install dotenv`

### Error: ChromaDB connection failed
- **Cause**: ChromaDB server not running
- **Solution**: Run `npm run chromadb:start`

## Token Savings

Using code execution pattern vs MCP tool calling:
- **Traditional MCP**: ~10,000 tokens for complex queries
- **Code Execution**: ~1,000 tokens for the same queries
- **Savings**: 90% reduction in token usage

## Best Practices

1. **Always use code execution** for agent interactions
2. **Choose one embedding type** and stick with it
3. **Use environment variables** for configuration
4. **Test with simple-test.ts** first when debugging
5. **Keep ChromaDB running** via `npm run chromadb:start`