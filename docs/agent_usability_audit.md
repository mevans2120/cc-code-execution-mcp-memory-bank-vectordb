# Agent Usability Audit: Claude Code Vector DB

## Overview
This audit evaluates the `claude-code-vectordb` codebase against the principles of **Code Execution with MCP** (Model Context Protocol). The goal is to determine how "agent-friendly" the current implementation is and identify opportunities to improve efficiency, latency, and capability for AI agents.

## Methodology
The audit is based on the research artifact `docs/mcp_research.md` and an inspection of the `src/lib` and `src/mcp-server` directories.

## Findings

### 1. "Tools as Code" Readiness
**Status: High Potential**
The codebase is well-structured for the "Tools as Code" pattern.
*   **Strengths**: The core logic is encapsulated in `src/lib/client.ts` within the `ProjectVectorDB` class. This class provides a clean, typed API (`query`, `addDocuments`, `getStats`) that is decoupled from the MCP transport layer.
*   **Implication**: An agent capable of executing TypeScript could import `ProjectVectorDB` directly and interact with the database programmatically, bypassing the overhead of individual HTTP-based tool calls.

### 2. Dynamic Tool Discovery
**Status: Missing**
*   **Current State**: The MCP server (`src/mcp-server/index.ts`) lists all tools (`query_vector_db`, `search_by_category`, `get_stats`, `get_recent_docs`, `add_documents`) in the initial handshake.
*   **Gap**: There is no `search_tools` capability. As the number of tools grows, this will bloat the context window for agents.
*   **Recommendation**: Implement a `search_tools` tool that allows agents to find specific capabilities on demand.

### 3. State Persistence
**Status: Partially Supported (Internal Only)**
*   **Current State**: The `ProjectVectorDB` class supports `exportBackup` and `importBackup`, which allows saving the database state to a JSONL file.
*   **Gap**: These methods are *not* exposed via the MCP server. An agent connecting via MCP cannot currently trigger a backup or restore state.
*   **Recommendation**: Expose `backup_database` and `restore_database` tools in the MCP server to allow agents to manage their own state persistence.

### 4. Progressive Disclosure
**Status: Flat Structure**
*   **Current State**: All tools are presented at the top level.
*   **Gap**: For a simple server, this is fine. However, if the server expands to include more complex operations (e.g., managing multiple collections, advanced filtering), a flat list will become unmanageable.
*   **Recommendation**: If the toolset grows > 10 tools, group them by domain (e.g., `read_*`, `write_*`, `admin_*`) or use a filesystem-based discovery approach.

## Recommendations

### Immediate Wins (Low Effort, High Value)
1.  **Re-implement `search_tools`**: Add the tool that was previously explored. This drastically reduces token usage for agents that don't need every tool immediately.
2.  **Expose Backup Tools**: Add `backup_database` to the MCP server. This allows an agent to "save game" before attempting risky operations.

### Strategic Improvements (Medium Effort)
1.  **Create an Agent SDK**: Package `src/lib/client.ts` and `src/lib/types.ts` into a distributable format (or ensure they are easily importable) so that "Code Mode" agents can use the library directly.
    *   *Example Usage for Agent*:
        ```typescript
        import { ProjectVectorDB } from 'claude-code-vectordb/client';
        const db = new ProjectVectorDB();
        await db.initialize();
        const results = await db.query("auth patterns");
        ```
2.  **Add "Skills"**: Create a `skills/` directory with pre-written scripts for common complex tasks (e.g., "Ingest all markdown files in directory X", "Summarize recent changes"). Agents can read and execute these scripts instead of reinventing the logic.

## Conclusion
The `claude-code-vectordb` is built on a solid foundation. The separation of concerns in `src/lib` makes it an excellent candidate for "Code Execution" patterns. By exposing the existing backup functionality and implementing dynamic discovery, it can become a best-in-class example of an agent-optimized MCP server.
