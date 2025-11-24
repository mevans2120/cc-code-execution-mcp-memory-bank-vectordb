# MVP Implementation Plan: Claude Code Vector DB

## Philosophy
Build features that are **highly likely to provide value** regardless of how the pilot evolves. Defer complex infrastructure and operationalization until after pilot validation.

## MVP Feature Set (High Confidence Winners)

### 1. Dynamic Tool Discovery (`search_tools`)
**Why include in MVP**: This will be valuable regardless of implementation details
- Reduces context bloat immediately (90%+ token savings)
- Simple to implement (~2-3 hours)
- Works with existing MCP clients
- Easy to remove if not needed

**Implementation**:
```typescript
// Add to MCP server
async function searchTools(query: string) {
  // Filter tool definitions based on query
  return relevantTools;
}
```

### 2. Expose Backup/Restore Tools
**Why include in MVP**: Already implemented in core, just needs MCP wrapper
- Essential for stateful workflows
- Enables "save game" functionality for agents
- Low risk - reuses existing tested code
- Critical for pilot testing safety

**Implementation**:
- Add `backup_database` and `restore_database` to MCP tools
- Reuse existing `exportBackup`/`importBackup` methods

### 3. Basic Agent SDK
**Why include in MVP**: The core abstraction is already solid
- The `ProjectVectorDB` class is already well-designed
- Just needs clean export for agent consumption
- Enables Code Mode testing in pilot
- Minimal additional work

**Implementation**:
```typescript
// src/agent-sdk/index.ts
export { ProjectVectorDB } from '../lib/client';
export * from '../lib/types';
```

### 4. One Demonstrative Skill
**Why include in MVP**: Proves the concept without over-investing
- Create just ONE skill (e.g., `ingest_directory.ts`)
- Shows the pattern without building a library
- Can expand based on pilot feedback
- Tests the code execution workflow

## Features to Defer Until After Pilot

### Post-Pilot Optimizations
These should wait until we validate the core approach:

1. **Comprehensive Security Framework**
   - Sandboxing specifications
   - Resource limits
   - Detailed SECURITY.md
   - *Reason to defer*: Pilot can run in controlled environment first

2. **Full Skills Library**
   - Multiple pre-built scripts
   - Skill discovery mechanism
   - *Reason to defer*: Let pilot reveal which skills are actually needed

3. **Performance Monitoring**
   - Telemetry and metrics
   - Usage analytics
   - *Reason to defer*: Premature optimization; pilot will show real bottlenecks

4. **Advanced Error Handling**
   - Retry mechanisms
   - Graceful degradation
   - *Reason to defer*: Pilot will reveal failure modes

5. **Documentation Suite**
   - Migration guides
   - Best practices
   - *Reason to defer*: Documentation should reflect validated patterns

## Pilot Test Plan

### Testing Environment
**Local Development Testing** - The pilot will run entirely on your local machine:
- MCP server running locally via `npm run dev`
- Vector DB (ChromaDB) running in local mode
- Test against your actual project's codebase/documentation
- No external dependencies or cloud services required
- Agent interactions via Claude Desktop or CLI with MCP support

### The MVP Validation Scenario
**"The Onboarding Assistant"** (from original plan, simplified)

**Given**: An agent with access to the MVP features running locally
**Task**: "Find all architecture docs and create a summary, but backup the database first"

**Success Criteria**:
1. Agent successfully uses `search_tools` to find only needed tools
2. Agent performs backup using exposed tool
3. Agent can either:
   - Use traditional tool calls to query and summarize, OR
   - Import the SDK and write a simple script
4. Token usage is measurably lower than full tool list approach

### Measurements to Capture
- Token count comparison (with/without `search_tools`)
- Number of round trips needed
- Time to completion
- Any errors or confusion points

## Implementation Timeline

### Week 1: MVP Features
- Day 1-2: Implement `search_tools` and test
- Day 3: Expose backup/restore tools
- Day 4: Create basic Agent SDK export
- Day 5: Write one demonstration skill

### Week 2: Pilot Testing
- Day 1-2: Run pilot scenario multiple times
- Day 3: Collect metrics and feedback
- Day 4: Document learnings and pain points
- Day 5: Decide on post-pilot roadmap

## Risk Mitigation

### What if Code Mode doesn't work well?
- MVP still provides value through `search_tools` alone
- Backup/restore tools are useful regardless
- Can pivot to focus on standard MCP optimization

### What if pilot reveals different needs?
- Low investment means easy to pivot
- Core abstractions (SDK) remain useful
- Can build different skills based on findings

## Definition of Success

The MVP is successful if:
1. **Token reduction**: At least 50% fewer tokens used with `search_tools`
2. **Functionality**: Agent completes the pilot task successfully
3. **Learning**: We identify clear next steps based on pilot results
4. **Reusability**: At least 2/3 of MVP features prove valuable

## Next Steps After Pilot

Based on pilot results, we'll decide whether to:
1. **Double down**: Build out full Code Mode infrastructure
2. **Pivot**: Focus on standard MCP optimizations
3. **Hybrid**: Keep `search_tools`, enhance traditional patterns
4. **Expand**: Add more sophisticated features based on learnings

## Conclusion

This MVP approach delivers immediate value through practical features while maintaining flexibility for post-pilot adjustments. By focusing on high-confidence improvements and deferring complex infrastructure, we can validate the core concepts quickly and adapt based on real-world results.