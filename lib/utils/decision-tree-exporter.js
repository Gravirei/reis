/**
 * Decision Tree Exporter
 * 
 * Export decision trees to multiple formats:
 * - HTML (standalone with collapsible tree)
 * - SVG (vector graphic)
 * - Mermaid (flowchart syntax)
 * - JSON (already in parser)
 */

const fs = require('fs');
const path = require('path');

/**
 * Export tree to standalone HTML file
 * @param {Object} tree - Parsed tree structure
 * @param {string} [outputPath] - Output file path (optional, returns HTML if not provided)
 * @returns {string|boolean} HTML string if no outputPath, true if file written
 */
function exportToHTML(tree, outputPath) {
  const html = generateHTML(tree);
  
  if (!outputPath) {
    return html;
  }
  
  fs.writeFileSync(outputPath, html, 'utf-8');
  return true;
}

/**
 * Generate HTML for a tree
 * @param {Object} tree - Parsed tree structure
 * @returns {string} HTML content
 */
function generateHTML(tree) {
  const branchHTML = (branch, level = 0) => {
    let html = '<details open>\n';
    html += '<summary>';
    
    // Add metadata badges
    if (branch.metadata) {
      if (branch.metadata.recommended) {
        html += '<span class="badge badge-recommended">★ Recommended</span> ';
      }
      if (branch.metadata.weight) {
        html += `<span class="badge badge-weight">Weight: ${branch.metadata.weight}</span> `;
      }
      if (branch.metadata.priority) {
        html += `<span class="badge badge-priority-${branch.metadata.priority}">${branch.metadata.priority}</span> `;
      }
      if (branch.metadata.risk) {
        html += `<span class="badge badge-risk-${branch.metadata.risk}">Risk: ${branch.metadata.risk}</span> `;
      }
    }
    
    html += escapeHTML(branch.text);
    
    if (branch.outcome) {
      html += ` <span class="outcome">→ ${escapeHTML(branch.outcome)}</span>`;
    }
    
    html += '</summary>\n';
    
    if (branch.children && branch.children.length > 0) {
      html += '<ul>\n';
      branch.children.forEach(child => {
        html += '<li>\n';
        html += branchHTML(child, level + 1);
        html += '</li>\n';
      });
      html += '</ul>\n';
    }
    
    html += '</details>\n';
    return html;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Decision Tree: ${escapeHTML(tree.name)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 2rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 0.5rem;
            font-size: 2rem;
        }
        
        .root-question {
            font-size: 1.25rem;
            color: #555;
            margin-bottom: 2rem;
            font-weight: 500;
        }
        
        details {
            margin: 0.5rem 0;
            padding-left: 1rem;
            border-left: 2px solid #e0e0e0;
        }
        
        details[open] {
            border-left-color: #3498db;
        }
        
        summary {
            cursor: pointer;
            padding: 0.75rem 1rem;
            background: #f8f9fa;
            border-radius: 4px;
            transition: all 0.2s;
            font-weight: 500;
            user-select: none;
        }
        
        summary:hover {
            background: #e9ecef;
        }
        
        summary::-webkit-details-marker {
            display: none;
        }
        
        summary::before {
            content: '▶';
            display: inline-block;
            margin-right: 0.5rem;
            transition: transform 0.2s;
        }
        
        details[open] > summary::before {
            transform: rotate(90deg);
        }
        
        ul {
            list-style: none;
            padding-left: 1rem;
            margin-top: 0.5rem;
        }
        
        li {
            margin: 0.25rem 0;
        }
        
        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.25rem;
            text-transform: uppercase;
        }
        
        .badge-recommended {
            background: #27ae60;
            color: white;
        }
        
        .badge-weight {
            background: #f39c12;
            color: white;
        }
        
        .badge-priority-high {
            background: #e74c3c;
            color: white;
        }
        
        .badge-priority-medium {
            background: #f39c12;
            color: white;
        }
        
        .badge-priority-low {
            background: #27ae60;
            color: white;
        }
        
        .badge-risk-high {
            background: #e74c3c;
            color: white;
        }
        
        .badge-risk-medium {
            background: #f39c12;
            color: white;
        }
        
        .badge-risk-low {
            background: #27ae60;
            color: white;
        }
        
        .outcome {
            color: #7f8c8d;
            font-style: italic;
            font-size: 0.9rem;
        }
        
        .controls {
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 4px;
        }
        
        .controls button {
            padding: 0.5rem 1rem;
            margin-right: 0.5rem;
            border: none;
            background: #3498db;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .controls button:hover {
            background: #2980b9;
        }
        
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #999;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Decision Tree: ${escapeHTML(tree.name)}</h1>
        <p class="root-question">${escapeHTML(tree.root)}</p>
        
        <div class="controls">
            <button onclick="expandAll()">Expand All</button>
            <button onclick="collapseAll()">Collapse All</button>
        </div>
        
        <div id="tree">
            ${tree.branches.map(b => branchHTML(b)).join('\n')}
        </div>
        
        <div class="footer">
            Generated by REIS Decision Tree System
        </div>
    </div>
    
    <script>
        function expandAll() {
            document.querySelectorAll('details').forEach(el => el.open = true);
        }
        
        function collapseAll() {
            document.querySelectorAll('details').forEach(el => el.open = false);
        }
    </script>
</body>
</html>`;
}

/**
 * Export tree to SVG
 * @param {Object} tree - Parsed tree structure
 * @param {string} [outputPath] - Output file path (optional, returns SVG if not provided)
 * @returns {string|boolean} SVG string if no outputPath, true if file written
 */
function exportToSVG(tree, outputPath) {
  const svg = generateSVG(tree);
  
  if (!outputPath) {
    return svg;
  }
  
  fs.writeFileSync(outputPath, svg, 'utf-8');
  return true;
}

/**
 * Generate SVG for a tree
 * @param {Object} tree - Parsed tree structure
 * @returns {string} SVG content
 */
function generateSVG(tree) {
  const nodeWidth = 200;
  const nodeHeight = 60;
  const horizontalSpacing = 250;
  const verticalSpacing = 100;
  
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  
  // Build node hierarchy
  function buildNodes(branch, x, y, parentId = null) {
    const currentId = nodeId++;
    
    nodes.push({
      id: currentId,
      text: branch.text,
      x,
      y,
      metadata: branch.metadata || {},
      outcome: branch.outcome
    });
    
    if (parentId !== null) {
      edges.push({ from: parentId, to: currentId });
    }
    
    if (branch.children && branch.children.length > 0) {
      const childrenWidth = (branch.children.length - 1) * horizontalSpacing;
      const startX = x - childrenWidth / 2;
      
      branch.children.forEach((child, i) => {
        buildNodes(child, startX + i * horizontalSpacing, y + verticalSpacing, currentId);
      });
    }
  }
  
  // Build from top-level branches
  const branchWidth = (tree.branches.length - 1) * horizontalSpacing;
  const startX = 500;
  const startY = 100;
  
  tree.branches.forEach((branch, i) => {
    buildNodes(branch, startX + i * horizontalSpacing - branchWidth / 2, startY);
  });
  
  // Calculate viewBox
  const minX = Math.min(...nodes.map(n => n.x)) - nodeWidth / 2 - 50;
  const maxX = Math.max(...nodes.map(n => n.x)) + nodeWidth / 2 + 50;
  const minY = Math.min(...nodes.map(n => n.y)) - nodeHeight / 2 - 50;
  const maxY = Math.max(...nodes.map(n => n.y)) + nodeHeight / 2 + 50;
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Generate SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}">
  <defs>
    <style>
      .node { fill: #f8f9fa; stroke: #3498db; stroke-width: 2; }
      .node-recommended { fill: #d4edda; stroke: #27ae60; }
      .text { font-family: Arial, sans-serif; font-size: 14px; text-anchor: middle; }
      .title { font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; text-anchor: middle; }
      .edge { stroke: #95a5a6; stroke-width: 2; fill: none; }
      .badge { font-size: 10px; fill: #666; }
    </style>
  </defs>
  
  <text class="title" x="${(minX + maxX) / 2}" y="${minY + 30}">${escapeHTML(tree.name)}</text>
  
  <g id="edges">
`;
  
  // Draw edges
  edges.forEach(edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    svg += `    <line class="edge" x1="${from.x}" y1="${from.y + nodeHeight / 2}" x2="${to.x}" y2="${to.y - nodeHeight / 2}" />\n`;
  });
  
  svg += `  </g>
  
  <g id="nodes">
`;
  
  // Draw nodes
  nodes.forEach(node => {
    const recommended = node.metadata.recommended;
    const nodeClass = recommended ? 'node node-recommended' : 'node';
    
    svg += `    <g>
      <rect class="${nodeClass}" x="${node.x - nodeWidth / 2}" y="${node.y - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="5" />
      <text class="text" x="${node.x}" y="${node.y}">${escapeHTML(truncate(node.text, 25))}</text>
`;
    
    if (node.metadata.weight) {
      svg += `      <text class="badge" x="${node.x}" y="${node.y + 15}">Weight: ${node.metadata.weight}</text>\n`;
    }
    
    svg += `    </g>\n`;
  });
  
  svg += `  </g>
</svg>`;
  
  return svg;
}

/**
 * Export tree to Mermaid flowchart syntax
 * @param {Object} tree - Parsed tree structure
 * @returns {string} Mermaid syntax
 */
function exportToMermaid(tree) {
  let mermaid = 'flowchart TD\n';
  let nodeId = 0;
  const nodeMap = new Map();
  
  function addBranch(branch, parentId = null) {
    const currentId = `N${nodeId++}`;
    nodeMap.set(branch.text, currentId);
    
    // Create node label
    let label = branch.text;
    if (branch.metadata && branch.metadata.recommended) {
      label = '★ ' + label;
    }
    
    // Different node shapes based on metadata
    let nodeShape = '[' + label + ']'; // Default rectangle
    if (branch.metadata && branch.metadata.recommended) {
      nodeShape = '([' + label + '])'; // Stadium shape for recommended
    }
    
    mermaid += `    ${currentId}${nodeShape}\n`;
    
    // Add edge from parent
    if (parentId !== null) {
      mermaid += `    ${parentId} --> ${currentId}\n`;
    }
    
    // Process children
    if (branch.children && branch.children.length > 0) {
      branch.children.forEach(child => {
        addBranch(child, currentId);
      });
    }
    
    return currentId;
  }
  
  // Add root
  const rootId = 'ROOT';
  mermaid += `    ${rootId}["${tree.root}"]\n`;
  
  // Add branches
  tree.branches.forEach(branch => {
    const branchId = addBranch(branch);
    mermaid += `    ${rootId} --> ${branchId}\n`;
  });
  
  return mermaid;
}

/**
 * Export tree to all formats
 * @param {Object} tree - Parsed tree structure
 * @param {string} basePath - Base path for output files (without extension)
 * @returns {Object} Object with paths to created files
 */
function exportAll(tree, basePath) {
  const paths = {
    html: basePath + '.html',
    svg: basePath + '.svg',
    mermaid: basePath + '.mmd',
    json: basePath + '.json'
  };
  
  exportToHTML(tree, paths.html);
  exportToSVG(tree, paths.svg);
  fs.writeFileSync(paths.mermaid, exportToMermaid(tree), 'utf-8');
  fs.writeFileSync(paths.json, JSON.stringify(tree, null, 2), 'utf-8');
  
  return paths;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

module.exports = {
  exportToHTML,
  exportToSVG,
  exportToMermaid,
  exportAll
};
