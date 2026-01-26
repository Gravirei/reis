const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { getVersion } = require('../utils/command-helpers.js');

/**
 * Parse CHANGELOG.md and extract changes for a specific version
 * @param {string} version - Version to find (e.g., "2.6.0")
 * @returns {object} - { found: boolean, title: string, sections: [{header, items}] }
 */
function parseChangelog(version) {
  const changelogPaths = [
    path.join(__dirname, '../../CHANGELOG.md'),
    path.join(process.cwd(), 'CHANGELOG.md')
  ];

  let changelogContent = null;
  for (const p of changelogPaths) {
    if (fs.existsSync(p)) {
      changelogContent = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!changelogContent) {
    return { found: false, title: '', sections: [] };
  }

  // Find the section for this version
  const versionRegex = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\].*$`, 'm');
  const match = changelogContent.match(versionRegex);
  
  if (!match) {
    return { found: false, title: '', sections: [] };
  }

  const startIndex = match.index;
  const title = match[0];

  // Find the next version section (or end of file)
  const nextVersionRegex = /^## \[/m;
  const afterStart = changelogContent.substring(startIndex + title.length);
  const nextMatch = afterStart.match(nextVersionRegex);
  
  const endIndex = nextMatch 
    ? startIndex + title.length + nextMatch.index 
    : changelogContent.length;

  const versionContent = changelogContent.substring(startIndex + title.length, endIndex).trim();

  // Parse sections (### headers)
  const sections = [];
  const sectionRegex = /^### (.+)$/gm;
  let lastIndex = 0;
  let currentSection = null;
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(versionContent)) !== null) {
    if (currentSection) {
      currentSection.content = versionContent.substring(lastIndex, sectionMatch.index).trim();
      sections.push(currentSection);
    }
    currentSection = { header: sectionMatch[1], content: '' };
    lastIndex = sectionMatch.index + sectionMatch[0].length;
  }

  if (currentSection) {
    currentSection.content = versionContent.substring(lastIndex).trim();
    sections.push(currentSection);
  }

  // If no ### sections, treat entire content as one section
  if (sections.length === 0 && versionContent) {
    sections.push({ header: 'Changes', content: versionContent });
  }

  return { found: true, title, sections };
}

/**
 * Format and display a section's content
 * @param {string} content - Section content
 * @param {function} w - White chalk function
 * @param {function} c - Cyan chalk function
 */
function displaySectionContent(content, w, c) {
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Skip code blocks for cleaner display
    if (line.startsWith('```')) continue;
    
    // Handle bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      console.log(c('   •') + w(' ' + line.substring(2)));
    }
    // Handle sub-headers (####)
    else if (line.startsWith('#### ')) {
      console.log('');
      console.log(w('   ' + line.substring(5)));
    }
    // Handle code in backticks (command examples)
    else if (line.includes('`') && !line.startsWith('```')) {
      // Display inline code lines
      const formatted = line.replace(/`([^`]+)`/g, chalk.cyan('$1'));
      console.log(w('   ' + formatted));
    }
    // Skip empty lines at start, show others
    else if (line.trim()) {
      console.log(w('   ' + line));
    }
  }
}

/**
 * Whats-new command - show recent changes and features
 * @param {Object} args - {}
 */
module.exports = function(args) {
  const version = getVersion();
  const w = chalk.bold.white;
  const g = chalk.green;
  const c = chalk.cyan;
  const y = chalk.yellow;

  // ASCII Art Banner
  console.log(w(`
                       ██████╗ ███████╗██╗███████╗
                       ██╔══██╗██╔════╝██║██╔════╝
                       ██████╔╝█████╗  ██║███████╗
                       ██╔══██╗██╔══╝  ██║╚════██║
                       ██║  ██║███████╗██║███████║
                       ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝
`));
  
  console.log(w('             REIS - Roadmap Execution & Implementation System'));
  console.log(w('                  Specially designed for Atlassian Rovo Dev'));
  console.log('');
  console.log(w('●  What\'s New in v' + version));
  console.log(w('   ' + '─'.repeat(18 + version.length)));
  console.log('');

  // Parse changelog for current version
  const changelog = parseChangelog(version);

  if (!changelog.found) {
    // Fallback if version not found in changelog
    console.log(y('   No changelog entry found for v' + version));
    console.log('');
    console.log(w('   This may be a development version or the changelog'));
    console.log(w('   hasn\'t been updated yet.'));
    console.log('');
    console.log(w('   For full documentation:'));
    console.log(c('   ~/.rovodev/reis/README.md'));
    console.log('');
    return;
  }

  // Display sections (limit to first 3 major sections for readability)
  const maxSections = 3;
  const displaySections = changelog.sections.slice(0, maxSections);

  for (const section of displaySections) {
    console.log(g('   ' + section.header));
    console.log('');
    
    // Limit content display for very long sections
    const contentLines = section.content.split('\n');
    const maxLines = 20;
    const truncatedContent = contentLines.slice(0, maxLines).join('\n');
    
    displaySectionContent(truncatedContent, w, c);
    
    if (contentLines.length > maxLines) {
      console.log('');
      console.log(y('   ... and more'));
    }
    console.log('');
  }

  if (changelog.sections.length > maxSections) {
    console.log(y(`   + ${changelog.sections.length - maxSections} more sections`));
    console.log('');
  }

  // Footer
  console.log(w('   ───────────────────────────────────────────────────────'));
  console.log('');
  console.log(w('   Full changelog:'));
  console.log(c('   ~/.rovodev/reis/CHANGELOG.md'));
  console.log('');
  console.log(w('   Documentation:'));
  console.log(c('   ~/.rovodev/reis/README.md'));
  console.log('');
};
