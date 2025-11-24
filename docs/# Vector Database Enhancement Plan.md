# Vector Database Enhancement Plan

## Executive Summary
Enhance Care Tracker's vector database to improve document relationships, search accuracy, and context preservation through metadata enrichment, hierarchical chunking, and cross-reference detection.

## Current State Assessment

### What We Have
- **176 documents** indexed as single chunks
- **Natural semantic clustering** working well (similar docs group by content)
- **Basic metadata**: type, path, extension, size, lastModified
- **Port 8001** dedicated ChromaDB instance
- **<100ms** search performance

### Limitations
- No explicit document relationships
- Large files indexed as single chunks (less granular search)
- No cross-reference tracking
- Missing tags/categories for filtering
- No temporal or phase-based grouping

## Enhancement Phases

## Phase 1: Metadata Enrichment (Week 1)
**Goal**: Add richer metadata for better filtering and relationships

### 1.1 Enhanced Metadata Schema
```typescript
interface EnhancedMetadata {
  // Existing
  path: string;
  type: string;
  extension: string;
  size: number;
  lastModified: string;

  // New additions
  category: string;           // 'notification', 'timeline', 'database', etc.
  tags: string[];             // ['firebase', 'push', 'mobile']
  phase: string;              // 'planning', 'implemented', 'archived'
  status: string;             // 'active', 'deprecated', 'reference'
  relatedDocs: string[];      // IDs of related documents
  parentDoc?: string;         // For hierarchical relationships
  sprint?: string;            // 'sprint-7', 'sprint-8'
  author?: string;            // Document author if known
}
```

### 1.2 Implementation Tasks
- [ ] Update `CareTrackerVectorDB` client to support enhanced metadata
- [ ] Modify `index-documentation.ts` to extract metadata
- [ ] Create metadata inference functions
- [ ] Re-index all documents with enhanced metadata

### 1.3 Metadata Extraction Functions
```typescript
// src/lib/vectordb/metadata-extractor.ts
export function extractMetadata(filePath: string, content: string): EnhancedMetadata {
  return {
    ...basicMetadata(filePath),
    category: inferCategory(filePath, content),
    tags: extractTags(content),
    phase: inferPhase(filePath),
    status: inferStatus(filePath, content),
    relatedDocs: findRelatedDocs(content),
    sprint: inferSprint(filePath, content)
  };
}
```

### 1.4 Category Mapping
```typescript
const CATEGORY_RULES = {
  'notification': /notification|firebase|push|alert/i,
  'timeline': /timeline|schedule|calendar|daily|weekly/i,
  'database': /database|prisma|supabase|schema|migration/i,
  'procedure': /procedure|surgery|recovery|care.*plan/i,
  'authentication': /auth|login|session|jwt|security/i,
  'ui-component': /component|button|modal|card|form/i,
  'api': /api|route|endpoint|REST|graphql/i,
  'testing': /test|spec|jest|vitest|coverage/i,
  'deployment': /deploy|vercel|production|ci.*cd/i
};
```

## Phase 2: Hierarchical Chunking (Week 2)
**Goal**: Split large documents into semantic sections for granular search

### 2.1 Chunking Strategy
```typescript
interface ChunkingConfig {
  maxChunkSize: 2000;        // Characters
  chunkOverlap: 200;         // Overlap between chunks
  splitBy: 'markdown' | 'sentence' | 'paragraph';
  preserveContext: boolean;  // Keep section headers
}
```

### 2.2 Implementation Tasks
- [ ] Create markdown-aware chunking algorithm
- [ ] Implement parent-child relationships for chunks
- [ ] Update search to aggregate chunk results
- [ ] Add chunk navigation in search results

### 2.3 Chunking Algorithm
```typescript
// src/lib/vectordb/chunker.ts
export function chunkDocument(content: string, config: ChunkingConfig): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  if (config.splitBy === 'markdown') {
    // Split by headers, preserving hierarchy
    const sections = splitByMarkdownHeaders(content);

    sections.forEach((section, index) => {
      if (section.content.length > config.maxChunkSize) {
        // Further split large sections
        const subChunks = splitBySize(section.content, config);
        chunks.push(...subChunks);
      } else {
        chunks.push({
          id: `${section.id}-chunk-${index}`,
          content: section.content,
          metadata: {
            ...section.metadata,
            chunkIndex: index,
            parentSection: section.header
          }
        });
      }
    });
  }

  return chunks;
}
```

### 2.4 Chunk Relationship Model
```typescript
interface DocumentChunk {
  id: string;
  parentDocId: string;
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    sectionHeader?: string;
    startLine: number;
    endLine: number;
    context?: string;  // Previous section summary
  };
}
```

## Phase 3: Cross-Reference Detection (Week 3)
**Goal**: Automatically detect and track references between documents

### 3.1 Reference Types
- **Markdown links**: `[text](./other-doc.md)`
- **Import statements**: `import { X } from './module'`
- **Feature mentions**: Detection of feature names in text
- **Issue references**: `#123`, `fixes #456`
- **TODO references**: `TODO: See implementation in X`

### 3.2 Implementation Tasks
- [ ] Build reference parser for multiple formats
- [ ] Create bidirectional reference tracking
- [ ] Add "referenced by" metadata
- [ ] Implement reference graph visualization

### 3.3 Reference Detection
```typescript
// src/lib/vectordb/reference-detector.ts
export function detectReferences(content: string, filePath: string): References {
  const references = {
    markdownLinks: extractMarkdownLinks(content),
    imports: extractImports(content),
    features: extractFeatureMentions(content),
    issues: extractIssueReferences(content),
    todos: extractTodoReferences(content)
  };

  return normalizeReferences(references, filePath);
}

function extractMarkdownLinks(content: string): string[] {
  const pattern = /\[([^\]]+)\]\(([^)]+\.(?:md|tsx?|jsx?))\)/g;
  const links = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    links.push(resolvePath(match[2]));
  }

  return links;
}
```

## Phase 4: Similarity Grouping (Week 4)
**Goal**: Create automatic document groups based on similarity

### 4.1 Grouping Strategies
- **Similarity threshold**: Group docs with distance < 0.85
- **Topic modeling**: Use LDA or similar for topic extraction
- **Cluster analysis**: K-means clustering on embeddings
- **Manual collections**: Curated document sets

### 4.2 Implementation Tasks
- [ ] Implement similarity-based grouping algorithm
- [ ] Create topic extraction pipeline
- [ ] Build collection management system
- [ ] Add group-based search filters

### 4.3 Auto-Grouping Algorithm
```typescript
// src/lib/vectordb/auto-grouper.ts
export async function createDocumentGroups(
  vectorDB: CareTrackerVectorDB,
  threshold: number = 0.85
): Promise<DocumentGroup[]> {
  const allDocs = await vectorDB.getAllDocuments();
  const groups: DocumentGroup[] = [];
  const processed = new Set<string>();

  for (const doc of allDocs) {
    if (processed.has(doc.id)) continue;

    // Find similar documents
    const similar = await vectorDB.search(doc.content, 20);
    const groupMembers = similar
      .filter(s => s.distance < threshold && !processed.has(s.id))
      .map(s => s.id);

    if (groupMembers.length > 1) {
      groups.push({
        id: `group-${groups.length}`,
        name: inferGroupName(groupMembers),
        members: groupMembers,
        centroid: doc.id,
        avgDistance: calculateAvgDistance(similar)
      });

      groupMembers.forEach(id => processed.add(id));
    }
  }

  return groups;
}
```

## Phase 5: Advanced Search Features (Week 5)
**Goal**: Implement sophisticated search capabilities

### 5.1 Search Enhancements
- **Faceted search**: Filter by category, tags, phase
- **Temporal search**: Find docs from specific time periods
- **Graph traversal**: Follow references to related docs
- **Contextual search**: Include surrounding context

### 5.2 Implementation Tasks
- [ ] Build faceted search interface
- [ ] Implement temporal filters
- [ ] Create reference graph traversal
- [ ] Add context window extraction

### 5.3 Enhanced Search API
```typescript
// src/lib/vectordb/enhanced-search.ts
export interface SearchOptions {
  query: string;
  limit?: number;
  filters?: {
    category?: string[];
    tags?: string[];
    phase?: string[];
    dateRange?: { start: Date; end: Date };
    hasReferences?: boolean;
  };
  includeContext?: boolean;
  followReferences?: boolean;
  groupResults?: boolean;
}

export async function enhancedSearch(
  vectorDB: CareTrackerVectorDB,
  options: SearchOptions
): Promise<EnhancedSearchResults> {
  // Initial vector search
  let results = await vectorDB.search(options.query, options.limit * 2);

  // Apply filters
  if (options.filters) {
    results = applyFilters(results, options.filters);
  }

  // Follow references
  if (options.followReferences) {
    results = await expandWithReferences(results, vectorDB);
  }

  // Group similar results
  if (options.groupResults) {
    results = groupSimilarResults(results);
  }

  // Add context
  if (options.includeContext) {
    results = await addContext(results, vectorDB);
  }

  return formatResults(results, options.limit);
}
```

## Implementation Timeline

### Week 1: Metadata Enrichment
- **Day 1-2**: Update schema and client
- **Day 3-4**: Build extraction functions
- **Day 5**: Re-index with enhanced metadata

### Week 2: Hierarchical Chunking
- **Day 1-2**: Implement chunking algorithm
- **Day 3-4**: Update indexing pipeline
- **Day 5**: Test and optimize chunk size

### Week 3: Cross-References
- **Day 1-2**: Build reference parsers
- **Day 3-4**: Implement bidirectional tracking
- **Day 5**: Create reference visualization

### Week 4: Similarity Grouping
- **Day 1-2**: Implement grouping algorithm
- **Day 3-4**: Build collection management
- **Day 5**: Add group search filters

### Week 5: Advanced Search
- **Day 1-2**: Implement faceted search
- **Day 3-4**: Add temporal and graph features
- **Day 5**: Testing and optimization

## Success Metrics

### Performance Targets
- Search latency: < 150ms (with enhancements)
- Indexing speed: > 100 docs/second
- Memory usage: < 500MB
- Relevance improvement: 25% better precision

### Quality Metrics
- Cross-reference accuracy: > 95%
- Category classification: > 90% correct
- Chunk coherence: > 85% semantic unity
- Group quality: < 0.85 intra-group distance

## Testing Strategy

### Unit Tests
```typescript
describe('VectorDB Enhancements', () => {
  test('extracts metadata correctly', async () => {
    const metadata = extractMetadata(testFile, testContent);
    expect(metadata.category).toBe('notification');
    expect(metadata.tags).toContain('firebase');
  });

  test('chunks documents properly', async () => {
    const chunks = chunkDocument(longContent, config);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].metadata.chunkIndex).toBe(0);
  });

  test('detects cross-references', async () => {
    const refs = detectReferences(contentWithLinks, filePath);
    expect(refs.markdownLinks).toHaveLength(3);
  });
});
```

### Integration Tests
- Test enhanced search with filters
- Verify chunk aggregation
- Validate reference following
- Check group formation

### Performance Tests
- Benchmark search with 10k documents
- Measure chunking overhead
- Test concurrent indexing
- Profile memory usage

## Migration Strategy

### Phase 1 Migration (Non-Breaking)
1. Add new metadata fields (optional)
2. Keep existing search working
3. Gradually enhance indexed docs
4. A/B test search improvements

### Phase 2 Migration (Breaking Changes)
1. Announce deprecation of old API
2. Provide migration scripts
3. Update all search calls
4. Remove legacy code

## Risk Mitigation

### Technical Risks
- **Increased complexity**: Mitigate with comprehensive tests
- **Performance degradation**: Implement caching layer
- **Storage growth**: Use compression and pruning
- **Breaking changes**: Version the API

### Mitigation Strategies
1. Feature flags for gradual rollout
2. Backwards compatibility layer
3. Rollback procedures
4. Performance monitoring

## Documentation Requirements

### Developer Docs
- [ ] Enhanced search API reference
- [ ] Metadata schema documentation
- [ ] Chunking configuration guide
- [ ] Migration guide

### User Guides
- [ ] Search syntax guide
- [ ] Filter usage examples
- [ ] Best practices document

## Maintenance Plan

### Regular Tasks
- Weekly: Review auto-generated groups
- Monthly: Optimize chunk sizes
- Quarterly: Update category rules
- Yearly: Full re-indexing

### Monitoring
- Search query patterns
- Most/least accessed documents
- Failed searches
- Performance metrics

## Conclusion

These enhancements will transform Care Tracker's vector database from a simple document store into an intelligent knowledge graph with rich relationships, granular search, and automatic organization. The phased approach ensures we can deliver value incrementally while maintaining system stability.

### Next Steps
1. Review and approve this plan
2. Set up feature branch
3. Begin Phase 1 implementation
4. Create progress tracking dashboard

---

**Document Status**: READY FOR REVIEW
**Created**: 2025-11-24
**Author**: Care Tracker Development Team
**Version**: 1.0.0