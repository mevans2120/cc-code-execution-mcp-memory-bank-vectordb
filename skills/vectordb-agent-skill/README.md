# Vector DB Agent Skill

An agent skill that provides seamless access to your project's vector database, enabling intelligent pattern search and knowledge retrieval during development.

## Installation

### Method 1: Direct Installation (Recommended)

```bash
# From the claude-code-vectordb directory
cp -r skills/vectordb-agent-skill ~/.claude/skills/vectordb

# Or use the install script
cd skills/vectordb-agent-skill
npm run install-skill
```

### Method 2: Symlink (For Development)

```bash
# Create a symlink for easy updates
ln -s ~/claude-code-vectordb/skills/vectordb-agent-skill ~/.claude/skills/vectordb
```

### Method 3: Manual Installation

1. Copy the entire `vectordb-agent-skill` folder to `~/.claude/skills/`
2. Rename it to `vectordb`
3. Restart Claude Code if needed

## Usage

Once installed, the skill is automatically available to agents. Simply mention search-related phrases:

### Natural Language Invocation

- "search vector db for authentication patterns"
- "find examples of error handling"
- "what patterns exist for API design"
- "check our database conventions"
- "how did we implement caching"

### Direct Command

```
/vectordb authentication patterns
```

## How It Works

1. **Agent detects search intent** in your conversation
2. **Skill automatically activates** without explicit invocation
3. **Expands query** with synonyms and related terms
4. **Searches vector database** using semantic similarity
5. **Returns formatted results** with relevance scores
6. **Agent incorporates findings** into its response

## Features

### Smart Query Expansion
- `auth` → `authentication, authorization, login, security`
- `db` → `database, schema, model, repository`
- `api` → `endpoint, REST, GraphQL, service`

### Relevance Scoring
- Shows similarity scores (0-1) for each result
- Orders by relevance automatically
- Filters below threshold (0.7 default)

### Metadata Display
- Category (architecture, patterns, guides)
- Source (docs, code, memory-bank)
- File path for reference
- Preview of content

## Examples

### Example 1: Planning Session
```
You: "I need to build a user preferences system"
Agent: [Skill activates] "Let me search for relevant patterns..."

Found 3 relevant results:

1. **Settings Module Pattern** (relevance: 0.92)
   Category: patterns
   Source: architecture-docs
   File: docs/patterns/settings.md
   Preview: User preferences should be stored in a normalized structure...

[Agent continues]: "Based on the existing patterns, I recommend using the Settings Module approach with..."
```

### Example 2: Convention Check
```
You: "What's our naming convention for API endpoints?"
Agent: [Skill activates] "Checking our conventions..."

Found established conventions:
1. RESTful resource naming
2. Kebab-case for URLs
3. Plural for collections
```

## Configuration

The skill uses these environment variables (optional):

```bash
# In your shell profile or .env
export CHROMA_URL=http://localhost:8000
export COLLECTION_NAME=project-docs
```

Default values:
- CHROMA_URL: `http://localhost:8000`
- COLLECTION_NAME: `project-docs`

## Prerequisites

1. **ChromaDB Running**
   ```bash
   cd ~/claude-code-vectordb
   npm run chromadb:start
   ```

2. **Vector DB Populated**
   ```bash
   tsx skills/ingest_directory.ts /path/to/docs
   ```

3. **Dependencies Installed**
   ```bash
   npm install chromadb
   ```

## Testing

Test the skill directly:

```bash
# Test search functionality
cd ~/.claude/skills/vectordb
tsx scripts/search.ts "authentication"

# Test with options
tsx scripts/search.ts "error handling" 10 "patterns"
```

## Troubleshooting

### Skill Not Activating

1. Check installation:
   ```bash
   ls ~/.claude/skills/vectordb
   ```

2. Verify skill file:
   ```bash
   cat ~/.claude/skills/vectordb/SKILL.md
   ```

3. Restart Claude Code

### No Results

1. Verify ChromaDB is running:
   ```bash
   curl http://localhost:8000/api/v1
   ```

2. Check collection exists:
   ```bash
   tsx -e "
   import { ChromaClient } from 'chromadb';
   const client = new ChromaClient({ path: 'http://localhost:8000' });
   const collections = await client.listCollections();
   console.log(collections);
   "
   ```

### Connection Errors

1. Start ChromaDB:
   ```bash
   npm run chromadb:start
   ```

2. Check port availability:
   ```bash
   lsof -i :8000
   ```

## Advantages Over Manual Search

1. **Automatic** - No need to remember to search
2. **Intelligent** - Query expansion and synonyms
3. **Contextual** - Integrates naturally into conversation
4. **Efficient** - Agent handles the search complexity
5. **Consistent** - Same search patterns every time

## Integration with Other Skills

The vectordb skill complements:
- **memory-core** - Searches long-term patterns while memory tracks session
- **documentation** - Uses search results to update docs
- **technical-architecture** - Informs architectural decisions
- **software-development** - Provides implementation patterns

## Privacy

- All searches are local
- No external API calls (except embeddings if configured)
- No telemetry or tracking
- Data never leaves your machine

## Contributing

To improve the skill:

1. Edit files in `~/claude-code-vectordb/skills/vectordb-agent-skill/`
2. Test changes locally
3. Submit improvements via PR

## License

MIT - Same as parent project

---

**Version**: 1.0.0
**Status**: Production Ready
**Support**: GitHub Issues