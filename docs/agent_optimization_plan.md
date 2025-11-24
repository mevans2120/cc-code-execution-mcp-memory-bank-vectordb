# Implementation Plan: Agent Optimization for Claude Code Vector DB

## Executive Summary
This plan outlines the roadmap to transform `claude-code-vectordb` into a "Code Execution First" MCP server. The goal is to reduce token usage by 90%+, improve agent latency, and enable complex, stateful workflows.

## Phased Implementation

### Phase 1: Dynamic Discovery & Efficiency (Week 1)
**Goal**: Solve the "Context Bloat" problem.
*   **Feature 1.1: `search_tools` Implementation**
    *   Add a `search_tools` tool to the MCP server.
    *   Modify the default `list_tools` to return *only* `search_tools` and critical basics (like `get_stats`) if the client supports it, or keep full list but encourage search.
*   **Feature 1.2: Lean Schemas**
    *   Review all tool schemas. Ensure descriptions are concise.
    *   Move extensive documentation to a "help" tool or the `search_tools` detailed response.

### Phase 2: Persistence & Safety (Week 1-2)
**Goal**: Enable long-running, stateful agent sessions.
*   **Feature 2.1: Expose Backup Tools**
    *   Wrap `ProjectVectorDB.exportBackup` and `importBackup` as MCP tools: `backup_database` and `restore_database`.
    *   Add a `reset_database` tool for testing workflows.
*   **Feature 2.2: Safety Sandboxing (Documentation)**
    *   Add a `SECURITY.md` describing how to run the server safely (e.g., restricting file access for backups).

### Phase 3: Code Mode SDK & Skills (Week 2)
**Goal**: Enable "Tools as Code" usage.
*   **Feature 3.1: Agent SDK**
    *   Create `src/client/index.ts` (or similar) that exports `ProjectVectorDB` and types in a clean, bundled format.
    *   Ensure it has zero dependencies on the MCP server code (only `chromadb` and `src/lib`).
*   **Feature 3.2: Skill Library**
    *   Create `skills/` directory.
    *   Add `skills/ingest_directory.ts`: A script that walks a directory and adds all MD files.
    *   Add `skills/semantic_search.ts`: A script that performs a search and filters results.

## Measurable Success Metrics

We will measure success by running a standard "Research Task" (e.g., "Find all docs about Authentication and summarize them") using two methods: **Standard MCP** vs. **Optimized MCP**.

| Metric | Definition | Target Improvement |
| :--- | :--- | :--- |
| **Context Load (Tokens)** | Total tokens used in the system prompt + tool definitions. | **> 90% Reduction** (via `search_tools` vs full list) |
| **Round Trips** | Number of LLM <-> Server turns to complete the task. | **50% Reduction** (via Code Mode batching) |
| **Latency** | Total wall-clock time to complete the task. | **30% Reduction** |
| **Success Rate** | Percentage of correct answers over 10 runs. | **Maintain 100%** |

## Real-Life Pilot: "The Onboarding Assistant"

To validate this plan, we will run a pilot using a "New Hire Onboarding" scenario.

### Scenario
An AI agent acting as a "Senior Engineer Buddy" needs to help a new user understand the codebase.

### The Task
"I'm new here. Can you read all the architecture docs, identify the core design patterns, and create a new markdown file `docs/onboarding_summary.md` with a summary? Also, please backup the database before you start just in case."

### Execution Flow (Optimized)
1.  **Discovery**: Agent sees `search_tools`. Calls `search_tools("backup")`.
2.  **Safety**: Agent calls `backup_database`.
3.  **Discovery**: Agent calls `search_tools("architecture")` -> finds `query_vector_db` and `search_by_category`.
4.  **Execution (Code Mode)**:
    *   Agent writes a script:
        ```typescript
        import { query } from './sdk';
        const docs = await query("architecture patterns", { limit: 10 });
        const summary = summarize(docs); // Internal LLM call
        await fs.writeFile('docs/onboarding_summary.md', summary);
        ```
5.  **Completion**: Agent reports success.

### Validation
We will consider the pilot successful if the agent completes this entire flow with **fewer than 5 tool calls** (Search -> Backup -> Search -> Code Execution -> Finish) and **under 5000 tokens** of overhead.
