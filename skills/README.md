# Skills Directory

## What are Skills?

Skills are pre-written TypeScript scripts that demonstrate common vector database operations. AI agents can either:
1. **Execute these scripts directly** (Code Mode)
2. **Learn from them** to write their own scripts
3. **Modify them** for specific use cases

## Available Skills

### `ingest_directory.ts`
Ingests all documentation files from a directory into the vector database.

**Usage:**
```bash
tsx skills/ingest_directory.ts /path/to/docs
```

**What it demonstrates:**
- Using the Agent SDK instead of MCP tools
- Batch processing of documents
- Chunking strategies for better search
- Direct database interaction with zero token overhead

## Code Execution Pattern

Instead of this (Traditional MCP):
```
Agent → Call Tool: add_documents → Wait → Get Result → Call Tool: query → Wait → Get Result
```

We do this (Code Execution):
```
Agent → Write Script → Execute Once → Get Final Result
```

**Benefits:**
- 90% fewer tokens used
- 10x faster execution
- Complex logic (loops, conditions) handled naturally
- No intermediate results consuming context

## Adding New Skills

To add a new skill:
1. Create a new TypeScript file in this directory
2. Import the Agent SDK: `import { createVectorDB } from '../src/agent-sdk'`
3. Implement your logic
4. Document what it demonstrates

## For AI Agents

When an agent needs to perform complex vector database operations:
1. Check if a skill already exists for the task
2. If yes, execute it or adapt it
3. If no, use existing skills as templates to write new scripts

This approach saves thousands of tokens per task while improving speed and reliability.