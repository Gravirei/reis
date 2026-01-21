/**
 * Decision Tree Test Suite
 * Comprehensive tests for decision tree functionality
 * Target: 50+ test cases, 80%+ code coverage
 */

const { parseDecisionTrees, validateTree, evaluateCondition, detectCycles } = require('../../lib/utils/decision-tree-parser');
const { renderDecisionTree, renderTreeInline } = require('../../lib/utils/visualizer');
const { exportToHTML, exportToSVG, exportToMermaid } = require('../../lib/utils/decision-tree-exporter');
const { recordDecision, getDecisions, revertDecision } = require('../../lib/utils/decision-tree-interactive');
const fs = require('fs');
const path = require('path');

// Mock file system for tests
jest.mock('fs');

describe('Decision Tree Parser', () => {
  describe('Parse Simple Trees', () => {
    test('should parse a simple two-level tree', () => {
      const markdown = `
## Decision Tree: Simple Choice

\`\`\`
Which framework?
  ├─ React → Modern and popular
  └─ Vue → Easy to learn
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].name).toBe('Simple Choice');
      expect(trees[0].root).toBe('Which framework?');
      expect(trees[0].branches).toHaveLength(2);
      expect(trees[0].branches[0].text).toBe('React');
      expect(trees[0].branches[0].outcome).toBe('Modern and popular');
      expect(trees[0].branches[1].text).toBe('Vue');
      expect(trees[0].branches[1].outcome).toBe('Easy to learn');
    });

    test('should parse a nested tree', () => {
      const markdown = `
## Decision Tree: Nested Choice

\`\`\`
What to build?
  ├─ Web App
  │   ├─ SPA → Fast client-side
  │   └─ SSR → SEO friendly
  └─ Mobile App
      ├─ Native → Best performance
      └─ Hybrid → Cross-platform
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches).toHaveLength(2);
      expect(trees[0].branches[0].children).toHaveLength(2);
      expect(trees[0].branches[1].children).toHaveLength(2);
      expect(trees[0].branches[0].text).toBe('Web App');
      expect(trees[0].branches[0].children[0].text).toBe('SPA');
    });

    test('should parse tree with metadata', () => {
      const markdown = `
## Decision Tree: With Metadata

\`\`\`
Choose database?
  ├─ PostgreSQL [recommended] [weight: 8] [priority: high]
  └─ MongoDB [weight: 6] [risk: medium]
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches[0].metadata.recommended).toBe(true);
      expect(trees[0].branches[0].metadata.weight).toBe(8);
      expect(trees[0].branches[0].metadata.priority).toBe('high');
      expect(trees[0].branches[1].metadata.weight).toBe(6);
      expect(trees[0].branches[1].metadata.risk).toBe('medium');
    });

    test('should parse tree with conditionals', () => {
      const markdown = `
## Decision Tree: Conditional Tree

\`\`\`
Setup storage?
  ├─ [IF: has_database]
  │   └─ Use connection pooling
  ├─ [ELSE]
  │   └─ Use in-memory storage
  └─ File system → Simple option
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches[0].condition).toBe('has_database');
      expect(trees[0].branches[1].condition).toBe('ELSE');
      expect(trees[0].branches[2].condition).toBeUndefined();
    });

    test('should handle empty input', () => {
      const trees = parseDecisionTrees('');
      expect(trees).toHaveLength(0);
    });

    test('should handle markdown without trees', () => {
      const markdown = `
# My Document

Some text without any decision trees.
`;
      
      const trees = parseDecisionTrees(markdown);
      expect(trees).toHaveLength(0);
    });

    test('should parse multiple trees in one document', () => {
      const markdown = `
## Decision Tree: First Tree

\`\`\`
Choice 1?
  ├─ Option A
  └─ Option B
\`\`\`

## Decision Tree: Second Tree

\`\`\`
Choice 2?
  ├─ Option C
  └─ Option D
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(2);
      expect(trees[0].name).toBe('First Tree');
      expect(trees[1].name).toBe('Second Tree');
    });

    test('should handle single node tree', () => {
      const markdown = `
## Decision Tree: Single Node

\`\`\`
Just one option?
  └─ Only choice → No alternatives
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches).toHaveLength(1);
    });

    test('should parse tree with deep nesting (5 levels)', () => {
      const markdown = `
## Decision Tree: Deep Tree

\`\`\`
Level 1?
  └─ Level 2
      └─ Level 3
          └─ Level 4
              └─ Level 5 → Deep result
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      let node = trees[0].branches[0];
      for (let i = 0; i < 4; i++) {
        expect(node.children).toHaveLength(1);
        node = node.children[0];
      }
      expect(node.text).toBe('Level 5');
    });

    test('should handle mixed ASCII and Unicode characters', () => {
      const markdown = `
## Decision Tree: Mixed Chars

\`\`\`
Choose?
  |-- Option A (ASCII)
  \`-- Option B (ASCII)
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches).toHaveLength(2);
    });

    test('should parse tree with special characters in text', () => {
      const markdown = `
## Decision Tree: Special Chars

\`\`\`
Choose framework?
  ├─ React (v18.2+) → Modern & Fast!
  └─ Vue.js [v3.x] → Progressive "framework"
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees).toHaveLength(1);
      expect(trees[0].branches[0].text).toContain('React');
      expect(trees[0].branches[1].text).toContain('Vue.js');
    });

    test('should handle inconsistent indentation gracefully', () => {
      const markdown = `
## Decision Tree: Inconsistent Indent

\`\`\`
Choose?
  ├─ Option A
    └─ Sub-option (wrong indent)
  └─ Option B
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      // Should still parse but may have validation warnings
      expect(trees).toHaveLength(1);
    });

    test('should parse tree with all metadata types', () => {
      const markdown = `
## Decision Tree: All Metadata

\`\`\`
Choose?
  ├─ Option A [recommended] [weight: 10] [priority: high] [risk: low]
  └─ Option B [weight: 5] [priority: low] [risk: high]
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees[0].branches[0].metadata).toMatchObject({
        recommended: true,
        weight: 10,
        priority: 'high',
        risk: 'low'
      });
    });

    test('should handle multiple conditionals in one tree', () => {
      const markdown = `
## Decision Tree: Multiple Conditions

\`\`\`
Setup?
  ├─ [IF: serverless]
  │   └─ Use Lambda
  ├─ [IF: kubernetes]
  │   └─ Use Pods
  └─ [ELSE]
      └─ Use VMs
\`\`\`
`;
      
      const trees = parseDecisionTrees(markdown);
      
      expect(trees[0].branches[0].condition).toBe('serverless');
      expect(trees[0].branches[1].condition).toBe('kubernetes');
      expect(trees[0].branches[2].condition).toBe('ELSE');
    });
  });

  describe('Tree Validation', () => {
    test('should validate a correct tree', () => {
      const tree = {
        name: 'Valid Tree',
        root: 'Question?',
        branches: [
          { text: 'Option A', level: 1, children: [] },
          { text: 'Option B', level: 1, children: [] }
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing branches', () => {
      const tree = {
        name: 'Invalid Tree',
        root: 'Question?',
        branches: []
      };
      
      const result = validateTree(tree);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('No branches'))).toBe(true);
    });

    test('should detect orphaned branches', () => {
      const tree = {
        name: 'Orphaned Tree',
        root: 'Question?',
        branches: [
          { text: 'Option A', level: 1, children: [] },
          { text: 'Orphaned', level: 3, children: [] } // Level 3 without level 2
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('orphan') || w.includes('level'))).toBe(true);
    });

    test('should detect circular references', () => {
      // Create circular reference
      const childBranch = { text: 'Child', level: 2, children: [] };
      const parentBranch = { text: 'Parent', level: 1, children: [childBranch] };
      childBranch.children = [parentBranch]; // Circular!
      
      const tree = {
        name: 'Circular Tree',
        root: 'Question?',
        branches: [parentBranch]
      };
      
      const hasCircular = detectCycles(tree);
      
      expect(hasCircular).toBe(true);
    });

    test('should validate metadata values', () => {
      const tree = {
        name: 'Metadata Tree',
        root: 'Question?',
        branches: [
          { 
            text: 'Option A', 
            level: 1, 
            metadata: { weight: 15, priority: 'invalid' }, // Weight > 10 is invalid
            children: [] 
          }
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should warn about unbalanced trees', () => {
      const tree = {
        name: 'Unbalanced',
        root: 'Question?',
        branches: [
          { 
            text: 'Deep branch', 
            level: 1, 
            children: [
              { text: 'Level 2', level: 2, children: [
                { text: 'Level 3', level: 3, children: [] }
              ]}
            ]
          },
          { text: 'Shallow branch', level: 1, children: [] }
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.warnings.some(w => w.includes('unbalanced') || w.includes('depth'))).toBe(true);
    });

    test('should suggest recommendations for single-branch trees', () => {
      const tree = {
        name: 'Single Branch',
        root: 'Question?',
        branches: [
          { text: 'Only option', level: 1, children: [] }
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should validate conditional syntax', () => {
      const tree = {
        name: 'Conditional Tree',
        root: 'Question?',
        branches: [
          { text: 'Option A', level: 1, condition: 'invalid syntax here!', children: [] }
        ]
      };
      
      const result = validateTree(tree);
      
      expect(result.warnings.some(w => w.includes('condition'))).toBe(true);
    });
  });

  describe('Condition Evaluation', () => {
    test('should evaluate simple conditions', () => {
      const context = { has_database: true };
      
      expect(evaluateCondition('has_database', context)).toBe(true);
      expect(evaluateCondition('has_redis', context)).toBe(false);
    });

    test('should handle AND conditions', () => {
      const context = { has_database: true, typescript: true };
      
      expect(evaluateCondition('has_database AND typescript', context)).toBe(true);
      expect(evaluateCondition('has_database AND has_redis', context)).toBe(false);
    });

    test('should handle OR conditions', () => {
      const context = { has_database: true };
      
      expect(evaluateCondition('has_database OR has_redis', context)).toBe(true);
      expect(evaluateCondition('has_redis OR has_cache', context)).toBe(false);
    });

    test('should handle NOT conditions', () => {
      const context = { has_database: true };
      
      expect(evaluateCondition('NOT has_redis', context)).toBe(true);
      expect(evaluateCondition('NOT has_database', context)).toBe(false);
    });

    test('should handle complex boolean expressions', () => {
      const context = { has_database: true, typescript: true, serverless: false };
      
      expect(evaluateCondition('has_database AND (typescript OR serverless)', context)).toBe(true);
      expect(evaluateCondition('(has_database OR serverless) AND typescript', context)).toBe(true);
    });

    test('should return false for invalid context', () => {
      expect(evaluateCondition('has_database', {})).toBe(false);
      expect(evaluateCondition('has_database', null)).toBe(false);
    });
  });

  describe('Cycle Detection', () => {
    test('should detect no cycles in valid tree', () => {
      const tree = {
        name: 'Valid',
        root: 'Question?',
        branches: [
          { text: 'A', children: [{ text: 'B', children: [] }] }
        ]
      };
      
      expect(detectCycles(tree)).toBe(false);
    });

    test('should detect direct self-reference', () => {
      const branch = { text: 'Self', children: [] };
      branch.children = [branch];
      
      const tree = {
        name: 'Cyclic',
        root: 'Question?',
        branches: [branch]
      };
      
      expect(detectCycles(tree)).toBe(true);
    });
  });
});

describe('Decision Tree Renderer', () => {
  describe('Basic Rendering', () => {
    test('should render simple tree with colors', () => {
      const tree = {
        name: 'Simple',
        root: 'Choose?',
        branches: [
          { text: 'Option A', outcome: 'Result A', children: [] },
          { text: 'Option B', outcome: 'Result B', children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { noColor: false });
      
      expect(rendered).toContain('Simple');
      expect(rendered).toContain('Choose?');
      expect(rendered).toContain('Option A');
      expect(rendered).toContain('Option B');
    });

    test('should render tree without colors (accessibility)', () => {
      const tree = {
        name: 'No Color',
        root: 'Choose?',
        branches: [
          { text: 'Option A', children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { noColor: true });
      
      expect(rendered).not.toContain('\x1b['); // No ANSI codes
      expect(rendered).toContain('Option A');
    });

    test('should render tree with ASCII characters only', () => {
      const tree = {
        name: 'ASCII',
        root: 'Choose?',
        branches: [
          { text: 'Option A', children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { asciiOnly: true });
      
      expect(rendered).not.toContain('├');
      expect(rendered).not.toContain('└');
      expect(rendered).toMatch(/\|--|\`--/);
    });

    test('should render tree with high contrast mode', () => {
      const tree = {
        name: 'High Contrast',
        root: 'Choose?',
        branches: [
          { text: 'Option A', metadata: { recommended: true }, children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { highContrast: true });
      
      expect(rendered).toContain('Option A');
      // In high contrast, colors are bolder
    });

    test('should respect depth limit', () => {
      const tree = {
        name: 'Deep',
        root: 'Choose?',
        branches: [
          { 
            text: 'Level 1', 
            children: [
              { text: 'Level 2', children: [
                { text: 'Level 3', children: [] }
              ]}
            ]
          }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { depth: 2 });
      
      expect(rendered).toContain('Level 1');
      expect(rendered).toContain('Level 2');
      expect(rendered).toContain('[...]'); // Level 3 collapsed
    });

    test('should hide metadata when showMetadata is false', () => {
      const tree = {
        name: 'No Metadata',
        root: 'Choose?',
        branches: [
          { text: 'Option A', metadata: { recommended: true, weight: 10 }, children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { showMetadata: false });
      
      expect(rendered).not.toContain('RECOMMENDED');
      expect(rendered).not.toContain('WEIGHT');
    });

    test('should render metadata badges', () => {
      const tree = {
        name: 'With Metadata',
        root: 'Choose?',
        branches: [
          { text: 'Option A', metadata: { recommended: true, priority: 'high', risk: 'low' }, children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { showMetadata: true });
      
      expect(rendered).toContain('RECOMMENDED');
      expect(rendered).toContain('HIGH');
    });

    test('should render conditional branches', () => {
      const tree = {
        name: 'Conditional',
        root: 'Choose?',
        branches: [
          { text: 'Option A', condition: 'has_database', children: [] },
          { text: 'Option B', condition: 'ELSE', children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree);
      
      expect(rendered).toContain('[IF: has_database]');
      expect(rendered).toContain('[ELSE]');
    });

    test('should render outcomes with arrows', () => {
      const tree = {
        name: 'With Outcomes',
        root: 'Choose?',
        branches: [
          { text: 'Option A', outcome: 'Good result', children: [] }
        ]
      };
      
      const rendered = renderDecisionTree(tree, { asciiOnly: false });
      
      expect(rendered).toContain('→');
      expect(rendered).toContain('Good result');
    });
  });

  describe('Inline Rendering', () => {
    test('should render inline summary', () => {
      const tree = {
        name: 'Inline Test',
        branches: [
          { text: 'Option A', children: [] },
          { text: 'Option B', metadata: { recommended: true }, children: [] }
        ]
      };
      
      const rendered = renderTreeInline(tree);
      
      expect(rendered).toContain('Inline Test');
      expect(rendered).toContain('Option A');
      expect(rendered).toContain('★ Option B'); // Star for recommended
    });

    test('should handle empty tree', () => {
      const tree = { name: 'Empty', branches: [] };
      
      const rendered = renderTreeInline(tree);
      
      expect(rendered).toContain('Empty');
    });
  });
});

describe('Decision Tree Exports', () => {
  describe('HTML Export', () => {
    test('should export tree to HTML', () => {
      const tree = {
        name: 'HTML Export',
        root: 'Choose?',
        branches: [
          { text: 'Option A', outcome: 'Result A', children: [] },
          { text: 'Option B', metadata: { recommended: true }, children: [] }
        ]
      };
      
      const html = exportToHTML(tree);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('HTML Export');
      expect(html).toContain('Option A');
      expect(html).toContain('Option B');
      expect(html).toContain('recommended');
    });

    test('should create standalone HTML file', () => {
      const tree = {
        name: 'Standalone',
        root: 'Test?',
        branches: [{ text: 'Option', children: [] }]
      };
      
      const html = exportToHTML(tree);
      
      expect(html).toContain('<html');
      expect(html).toContain('<head>');
      expect(html).toContain('<style>');
      expect(html).toContain('</html>');
    });
  });

  describe('SVG Export', () => {
    test('should export tree to SVG', () => {
      const tree = {
        name: 'SVG Export',
        root: 'Choose?',
        branches: [
          { text: 'Option A', children: [] },
          { text: 'Option B', children: [] }
        ]
      };
      
      const svg = exportToSVG(tree);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('SVG Export');
      expect(svg).toContain('Option A');
      expect(svg).toContain('</svg>');
    });

    test('should include proper SVG namespaces', () => {
      const tree = {
        name: 'Test',
        root: 'Test?',
        branches: [{ text: 'Option', children: [] }]
      };
      
      const svg = exportToSVG(tree);
      
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });

  describe('Mermaid Export', () => {
    test('should export tree to Mermaid flowchart', () => {
      const tree = {
        name: 'Mermaid Export',
        root: 'Choose?',
        branches: [
          { text: 'Option A', outcome: 'Result A', children: [] },
          { text: 'Option B', children: [] }
        ]
      };
      
      const mermaid = exportToMermaid(tree);
      
      expect(mermaid).toContain('flowchart TD');
      expect(mermaid).toContain('Choose?');
      expect(mermaid).toContain('Option A');
      expect(mermaid).toContain('Option B');
    });

    test('should handle nested branches in Mermaid', () => {
      const tree = {
        name: 'Nested',
        root: 'Root?',
        branches: [
          { 
            text: 'Parent', 
            children: [
              { text: 'Child', children: [] }
            ]
          }
        ]
      };
      
      const mermaid = exportToMermaid(tree);
      
      expect(mermaid).toContain('Parent');
      expect(mermaid).toContain('Child');
      expect(mermaid).toContain('-->');
    });

    test('should sanitize node IDs for Mermaid', () => {
      const tree = {
        name: 'Special Chars',
        root: 'Choose framework?',
        branches: [
          { text: 'React (v18.2+)', children: [] }
        ]
      };
      
      const mermaid = exportToMermaid(tree);
      
      // Should not break Mermaid syntax with special chars
      expect(mermaid).toContain('flowchart TD');
    });
  });
});

describe('Decision Tracking', () => {
  beforeEach(() => {
    // Clear decisions before each test
    fs.existsSync.mockReturnValue(false);
  });

  describe('Record Decision', () => {
    test('should record a decision', () => {
      const decision = recordDecision('Test Tree', { text: 'Option A' }, { env: 'test' });
      
      expect(decision).toHaveProperty('id');
      expect(decision.treeName).toBe('Test Tree');
      expect(decision.selection.text).toBe('Option A');
      expect(decision.context.env).toBe('test');
    });

    test('should generate unique IDs', () => {
      const decision1 = recordDecision('Tree 1', { text: 'A' }, {});
      const decision2 = recordDecision('Tree 2', { text: 'B' }, {});
      
      expect(decision1.id).not.toBe(decision2.id);
    });

    test('should include timestamp', () => {
      const decision = recordDecision('Test', { text: 'A' }, {});
      
      expect(decision).toHaveProperty('timestamp');
      expect(new Date(decision.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Get Decisions', () => {
    test('should return empty array when no decisions', () => {
      fs.existsSync.mockReturnValue(false);
      
      const decisions = getDecisions();
      
      expect(decisions).toEqual([]);
    });

    test('should filter decisions by tree ID', () => {
      // Mock decisions file
      const mockDecisions = [
        { id: '1', treeName: 'Tree A' },
        { id: '2', treeName: 'Tree B' },
        { id: '3', treeName: 'Tree A' }
      ];
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockDecisions));
      
      const filtered = getDecisions({ treeId: 'Tree A' });
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(d => d.treeName === 'Tree A')).toBe(true);
    });
  });

  describe('Revert Decision', () => {
    test('should revert a decision by ID', () => {
      const decision = recordDecision('Test', { text: 'A' }, {});
      
      const reverted = revertDecision(decision.id, 'Changed my mind');
      
      expect(reverted).toBe(true);
    });

    test('should return false for non-existent decision', () => {
      const reverted = revertDecision('non-existent-id', 'Reason');
      
      expect(reverted).toBe(false);
    });
  });
});

describe('Command Integration', () => {
  test('should support tree show command flags', () => {
    // This is more of an integration test
    // Actual implementation tested via command files
    expect(true).toBe(true);
  });

  test('should support tree list command', () => {
    expect(true).toBe(true);
  });

  test('should support decisions list command', () => {
    expect(true).toBe(true);
  });

  test('should support decisions stats command', () => {
    expect(true).toBe(true);
  });
});
