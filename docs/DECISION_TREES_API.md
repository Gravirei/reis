# Decision Trees API Reference

This document provides a comprehensive API reference for using decision trees programmatically in REIS.

## Table of Contents

- [Parser API](#parser-api)
- [Renderer API](#renderer-api)
- [Exporter API](#exporter-api)
- [Interactive API](#interactive-api)
- [Tracker API](#tracker-api)
- [Validation API](#validation-api)
- [Accessibility API](#accessibility-api)

---

## Parser API

### `parseDecisionTrees(markdownContent)`

Parse decision trees from markdown content.

**Parameters:**
- `markdownContent` (string): Markdown text containing decision trees

**Returns:** Array of tree objects

**Example:**

```javascript
const { parseDecisionTrees } = require('./lib/utils/decision-tree-parser');

const markdown = `
## Decision Tree: Choose Framework

\`\`\`
Which framework?
  ├─ React [recommended] → Popular choice
  └─ Vue → Easy to learn
\`\`\`
`;

const trees = parseDecisionTrees(markdown);
console.log(trees);
// [{
//   name: 'Choose Framework',
//   root: 'Which framework?',
//   branches: [
//     { text: 'React', metadata: { recommended: true }, outcome: 'Popular choice', children: [] },
//     { text: 'Vue', outcome: 'Easy to learn', children: [] }
//   ]
// }]
```

**Tree Object Structure:**

```javascript
{
  name: string,              // Tree name from "## Decision Tree: [Name]"
  root: string,              // Root question or scenario
  branches: [
    {
      text: string,          // Branch text
      level: number,         // Nesting level (1-based)
      outcome?: string,      // Outcome after → arrow
      condition?: string,    // Conditional: 'has_database', 'ELSE', etc.
      metadata: {            // Optional metadata
        weight?: number,     // 1-10
        priority?: string,   // 'high', 'medium', 'low'
        risk?: string,       // 'high', 'medium', 'low'
        recommended?: boolean
      },
      children: []           // Nested branches (recursive)
    }
  ]
}
```

### `validateTree(treeData)`

Validate tree structure and semantics.

**Parameters:**
- `treeData` (object): Tree object from `parseDecisionTrees`

**Returns:** Validation result object

**Example:**

```javascript
const { validateTree } = require('./lib/utils/decision-tree-parser');

const tree = parseDecisionTrees(markdown)[0];
const result = validateTree(tree);

console.log(result);
// {
//   valid: true,
//   errors: [],
//   warnings: ['Tree has only 2 branches, consider adding more options'],
//   suggestions: ['Add metadata to guide decision-making']
// }
```

### `evaluateCondition(condition, context)`

Evaluate a conditional branch against project context.

**Parameters:**
- `condition` (string): Condition expression (e.g., 'has_database', 'typescript AND serverless')
- `context` (object): Project context object

**Returns:** Boolean (true if condition matches)

**Example:**

```javascript
const { evaluateCondition } = require('./lib/utils/decision-tree-parser');

const context = {
  has_database: true,
  typescript: true,
  serverless: false
};

evaluateCondition('has_database', context);          // true
evaluateCondition('serverless', context);            // false
evaluateCondition('has_database AND typescript', context);  // true
evaluateCondition('serverless OR typescript', context);     // true
evaluateCondition('NOT serverless', context);        // true
```

### `detectCycles(treeData)`

Detect circular references in tree structure.

**Parameters:**
- `treeData` (object): Tree object

**Returns:** Boolean (true if cycles detected)

**Example:**

```javascript
const { detectCycles } = require('./lib/utils/decision-tree-parser');

const hasCycles = detectCycles(tree);
if (hasCycles) {
  console.error('Tree contains circular references!');
}
```

---

## Renderer API

### `renderDecisionTree(treeData, options)`

Render decision tree to terminal with colors and formatting.

**Parameters:**
- `treeData` (object): Tree object from parser
- `options` (object): Rendering options

**Options:**
```javascript
{
  depth: number,              // Maximum depth to display (default: Infinity)
  expandAll: boolean,         // Show all branches (default: true)
  collapseAll: boolean,       // Collapse all branches (default: false)
  showMetadata: boolean,      // Show metadata badges (default: true)
  evaluateConditions: boolean, // Filter by conditions (default: false)
  context: object,            // Context for condition evaluation (default: {})
  noColor: boolean,           // Disable colors (default: false)
  highContrast: boolean,      // High contrast mode (default: false)
  asciiOnly: boolean          // ASCII characters only (default: false)
}
```

**Returns:** Formatted string with ANSI color codes

**Example:**

```javascript
const { renderDecisionTree } = require('./lib/utils/visualizer');

// Basic rendering
const output = renderDecisionTree(tree);
console.log(output);

// With options
const accessibleOutput = renderDecisionTree(tree, {
  depth: 2,
  noColor: true,
  asciiOnly: true
});

// High contrast mode
const highContrastOutput = renderDecisionTree(tree, {
  highContrast: true,
  showMetadata: true
});

// Conditional filtering
const contextualOutput = renderDecisionTree(tree, {
  evaluateConditions: true,
  context: { has_database: true, serverless: true }
});
```

### `renderTreeInline(treeData)`

Render compact one-line summary.

**Parameters:**
- `treeData` (object): Tree object

**Returns:** Compact string summary

**Example:**

```javascript
const { renderTreeInline } = require('./lib/utils/visualizer');

const inline = renderTreeInline(tree);
console.log(inline);
// "Choose Framework: React, Vue"
```

---

## Exporter API

### `exportToHTML(treeData, options)`

Export tree to standalone HTML file.

**Parameters:**
- `treeData` (object): Tree object
- `options` (object): Export options (optional)

**Returns:** HTML string

**Example:**

```javascript
const { exportToHTML } = require('./lib/utils/decision-tree-exporter');
const fs = require('fs');

const html = exportToHTML(tree);
fs.writeFileSync('decision.html', html);
```

**Generated HTML Features:**
- Standalone file (no external dependencies)
- Collapsible branches with JavaScript
- CSS styling with colors and badges
- Responsive design
- Print-friendly

### `exportToSVG(treeData, options)`

Export tree to SVG vector graphic.

**Parameters:**
- `treeData` (object): Tree object
- `options` (object): Export options (optional)

**Returns:** SVG string

**Example:**

```javascript
const { exportToSVG } = require('./lib/utils/decision-tree-exporter');
const fs = require('fs');

const svg = exportToSVG(tree, { width: 800, height: 600 });
fs.writeFileSync('decision.svg', svg);
```

### `exportToMermaid(treeData, options)`

Export tree to Mermaid flowchart syntax.

**Parameters:**
- `treeData` (object): Tree object
- `options` (object): Export options (optional)

**Returns:** Mermaid markdown string

**Example:**

```javascript
const { exportToMermaid } = require('./lib/utils/decision-tree-exporter');
const fs = require('fs');

const mermaid = exportToMermaid(tree);
fs.writeFileSync('decision.mmd', mermaid);

// Use in markdown:
// ```mermaid
// [mermaid content here]
// ```
```

### `exportAll(treeData, outputPath)`

Export to all formats at once.

**Parameters:**
- `treeData` (object): Tree object
- `outputPath` (string): Base output path (without extension)

**Returns:** Object with paths to all generated files

**Example:**

```javascript
const { exportAll } = require('./lib/utils/decision-tree-exporter');

const files = exportAll(tree, 'output/my-decision');
console.log(files);
// {
//   html: 'output/my-decision.html',
//   svg: 'output/my-decision.svg',
//   mermaid: 'output/my-decision.mmd',
//   json: 'output/my-decision.json'
// }
```

---

## Interactive API

### `selectBranch(treeData, options)`

Interactive branch selection with arrow keys.

**Parameters:**
- `treeData` (object): Tree object
- `options` (object): Interactive options

**Returns:** Promise resolving to selected branch object

**Example:**

```javascript
const { selectBranch } = require('./lib/utils/decision-tree-interactive');

async function makeDecision() {
  const tree = parseDecisionTrees(markdown)[0];
  
  try {
    const selection = await selectBranch(tree, {
      showMetadata: true,
      context: { has_database: true }
    });
    
    console.log('Selected:', selection.text);
    console.log('Path:', selection.path);
  } catch (error) {
    console.log('Selection cancelled');
  }
}
```

### `selectFromMultipleTrees(trees, options)`

Select from multiple trees in one document.

**Parameters:**
- `trees` (array): Array of tree objects
- `options` (object): Interactive options

**Returns:** Promise resolving to selection result

**Example:**

```javascript
const { selectFromMultipleTrees } = require('./lib/utils/decision-tree-interactive');

const trees = parseDecisionTrees(markdown); // Multiple trees

const result = await selectFromMultipleTrees(trees, {
  showMetadata: true
});

console.log('Tree:', result.tree.name);
console.log('Selection:', result.selection.text);
```

### `showDecisionSummary(selection)`

Display formatted decision summary.

**Parameters:**
- `selection` (object): Selection object from `selectBranch`

**Returns:** void (prints to console)

**Example:**

```javascript
const { showDecisionSummary } = require('./lib/utils/decision-tree-interactive');

showDecisionSummary(selection);
// Displays:
// ✓ Decision Made: React
// Path: Choose Framework → React
// Outcome: Popular choice
// Metadata: [RECOMMENDED] [WEIGHT: 9]
```

---

## Tracker API

### `recordDecision(treeName, selection, context)`

Record a decision for tracking.

**Parameters:**
- `treeName` (string): Name of the decision tree
- `selection` (object): Selected branch object
- `context` (object): Project context at time of decision

**Returns:** Decision object with unique ID

**Example:**

```javascript
const { recordDecision } = require('./lib/utils/decision-tree-interactive');

const decision = recordDecision('Choose Framework', selection, {
  project: 'my-app',
  phase: 'setup',
  developer: 'Alice'
});

console.log('Decision ID:', decision.id);
// Decision ID: a1b2c3d4
```

**Decision Object Structure:**

```javascript
{
  id: string,                // Unique ID (8-char hash)
  timestamp: string,         // ISO 8601 timestamp
  treeName: string,          // Tree name
  selection: {               // Selected branch
    text: string,
    outcome: string,
    metadata: object,
    path: string[]           // Full path from root
  },
  context: object,           // Project context
  reverted: boolean,         // Revert status
  revertReason?: string      // Reason if reverted
}
```

### `getDecisions(filters)`

Query recorded decisions.

**Parameters:**
- `filters` (object): Filter criteria (optional)

**Filter Options:**
```javascript
{
  treeId: string,     // Filter by tree name
  phase: string,      // Filter by phase
  limit: number,      // Limit results
  from: string,       // From date (ISO 8601)
  to: string          // To date (ISO 8601)
}
```

**Returns:** Array of decision objects

**Example:**

```javascript
const { getDecisions } = require('./lib/utils/decision-tree-interactive');

// All decisions
const all = getDecisions();

// Filtered
const authDecisions = getDecisions({ 
  treeId: 'Choose Authentication Strategy',
  limit: 10 
});

// By date range
const recent = getDecisions({
  from: '2026-01-01T00:00:00Z',
  to: '2026-01-31T23:59:59Z'
});
```

### `revertDecision(decisionId, reason)`

Revert a recorded decision.

**Parameters:**
- `decisionId` (string): Decision ID (full or partial)
- `reason` (string): Reason for reverting

**Returns:** Boolean (true if successful)

**Example:**

```javascript
const { revertDecision } = require('./lib/utils/decision-tree-interactive');

const reverted = revertDecision('a1b2c3d4', 'Requirements changed');
if (reverted) {
  console.log('Decision reverted successfully');
}
```

### `exportDecisions(format, outputPath)`

Export decision history.

**Parameters:**
- `format` (string): 'json' or 'csv'
- `outputPath` (string): Output file path

**Returns:** Boolean (true if successful)

**Example:**

```javascript
const { exportDecisions } = require('./lib/utils/decision-tree-interactive');

// Export as JSON
exportDecisions('json', 'decisions.json');

// Export as CSV (for Excel/Sheets)
exportDecisions('csv', 'decisions.csv');
```

---

## Validation API

### `lintTree(treeData, options)`

Perform semantic linting on tree.

**Parameters:**
- `treeData` (object): Tree object
- `options` (object): Linting options

**Options:**
```javascript
{
  strict: boolean,      // Fail on warnings (default: false)
  rules: string[]       // Specific rules to check
}
```

**Returns:** Lint result object

**Example:**

```javascript
const { lintTree } = require('./lib/utils/decision-tree-parser');

const result = lintTree(tree, { strict: true });

console.log(result);
// {
//   passed: false,
//   errors: [],
//   warnings: [
//     'Tree is unbalanced (depth varies by 3 levels)',
//     'Branch "Option A" has no outcome specified'
//   ],
//   suggestions: [
//     'Consider adding metadata to guide decisions',
//     'Add [recommended] tag to best option'
//   ]
// }
```

---

## Accessibility API

### `getAccessibilityConfig(cliFlags)`

Get accessibility configuration from flags and environment.

**Parameters:**
- `cliFlags` (object): CLI flags object

**Returns:** Accessibility configuration object

**Example:**

```javascript
const { getAccessibilityConfig } = require('./lib/utils/accessibility-config');

const config = getAccessibilityConfig({
  noColor: true,
  asciiOnly: true
});

console.log(config);
// {
//   noColor: true,
//   highContrast: false,
//   asciiOnly: true,
//   screenReader: false
// }
```

### `getBoxChars(config)`

Get box-drawing characters based on accessibility settings.

**Parameters:**
- `config` (object): Accessibility config

**Returns:** Character set object

**Example:**

```javascript
const { getBoxChars } = require('./lib/utils/accessibility-config');

const chars = getBoxChars({ asciiOnly: true });
console.log(chars.branch);      // '|--'
console.log(chars.lastBranch);  // '`--'

const unicodeChars = getBoxChars({ asciiOnly: false });
console.log(unicodeChars.branch);      // '├─'
console.log(unicodeChars.lastBranch);  // '└─'
```

### `renderAccessibleTree(treeData, config)`

Render tree with full accessibility support.

**Parameters:**
- `treeData` (object): Tree object
- `config` (object): Accessibility configuration

**Returns:** Accessible tree string

**Example:**

```javascript
const { renderAccessibleTree } = require('./lib/utils/accessibility-config');

const config = {
  noColor: true,
  asciiOnly: true,
  screenReader: true
};

const accessibleTree = renderAccessibleTree(tree, config);
console.log(accessibleTree);
// DECISION TREE: Choose Framework
// QUESTION: Which framework?
// ITEM: |-- React [RECOMMENDED] -> Popular choice
// ITEM: `-- Vue -> Easy to learn
```

---

## Complete Example

Here's a complete example using multiple APIs:

```javascript
const fs = require('fs');
const { parseDecisionTrees, validateTree } = require('./lib/utils/decision-tree-parser');
const { renderDecisionTree } = require('./lib/utils/visualizer');
const { selectBranch, recordDecision } = require('./lib/utils/decision-tree-interactive');
const { exportToHTML, exportToSVG } = require('./lib/utils/decision-tree-exporter');

async function makeAndRecordDecision(markdownPath) {
  // 1. Read and parse
  const markdown = fs.readFileSync(markdownPath, 'utf-8');
  const trees = parseDecisionTrees(markdown);
  
  if (trees.length === 0) {
    console.error('No trees found');
    return;
  }
  
  const tree = trees[0];
  
  // 2. Validate
  const validation = validateTree(tree);
  if (!validation.valid) {
    console.error('Tree validation failed:', validation.errors);
    return;
  }
  
  // 3. Display
  console.log(renderDecisionTree(tree, { showMetadata: true }));
  
  // 4. Interactive selection
  try {
    const selection = await selectBranch(tree);
    console.log('\nYou selected:', selection.text);
    
    // 5. Record decision
    const decision = recordDecision(tree.name, selection, {
      project: 'my-app',
      phase: 'architecture'
    });
    console.log('Decision recorded:', decision.id);
    
    // 6. Export for documentation
    const html = exportToHTML(tree);
    fs.writeFileSync('decision.html', html);
    
    const svg = exportToSVG(tree);
    fs.writeFileSync('decision.svg', svg);
    
    console.log('Exported to HTML and SVG');
    
  } catch (error) {
    console.log('Selection cancelled');
  }
}

// Run it
makeAndRecordDecision('examples/decision-trees/real-world-auth.md');
```

---

## Environment Variables

Decision tree features respect these environment variables:

- `REIS_NO_COLOR` - Disable all colors (true/false)
- `REIS_HIGH_CONTRAST` - Enable high contrast mode (true/false)
- `REIS_ASCII_ONLY` - Use ASCII characters only (true/false)
- `REIS_SCREEN_READER` - Optimize for screen readers (true/false)
- `NO_COLOR` - Standard no-color convention (any value disables colors)
- `TERM` - Terminal type (dumb disables colors automatically)

**Example:**

```bash
# Disable colors for screen reader
REIS_NO_COLOR=true reis tree show decision.md

# High contrast mode
REIS_HIGH_CONTRAST=true reis tree show decision.md

# ASCII only
REIS_ASCII_ONLY=true reis tree show decision.md
```

---

## Error Handling

All APIs throw descriptive errors that can be caught:

```javascript
try {
  const trees = parseDecisionTrees(markdown);
  const tree = trees[0];
  
  const validation = validateTree(tree);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  const output = renderDecisionTree(tree);
  console.log(output);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
```

---

## TypeScript Support

While REIS is written in JavaScript, you can add type definitions:

```typescript
interface TreeBranch {
  text: string;
  level: number;
  outcome?: string;
  condition?: string;
  metadata?: {
    weight?: number;
    priority?: 'high' | 'medium' | 'low';
    risk?: 'high' | 'medium' | 'low';
    recommended?: boolean;
  };
  children: TreeBranch[];
}

interface DecisionTree {
  name: string;
  root: string;
  branches: TreeBranch[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
```

---

## See Also

- [Decision Trees Guide](DECISION_TREES.md) - Syntax and usage
- [Examples](../examples/decision-trees/) - Example decision trees
- [CLI Commands](COMPLETE_COMMANDS.md) - Command-line interface
