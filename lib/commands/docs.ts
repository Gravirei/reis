import { showInfo } from '../utils/command-helpers.js';

interface DocsArgs {
  [key: string]: unknown;
}

/**
 * Docs command - show documentation locations
 * @param args - {}
 */
export function docs(args: DocsArgs): void {
  showInfo('REIS Documentation');
  showInfo('');
  showInfo('Documentation is installed at:');
  showInfo('  ~/.rovodev/reis/');
  showInfo('  ~/.gemini/reis/');
  showInfo('');
  showInfo('Available docs:');
  showInfo('  • README.md - Main documentation');
  showInfo('  • QUICK_REFERENCE.md - Quick command reference');
  showInfo('  • WORKFLOW_EXAMPLES.md - Example workflows');
  showInfo('  • COMPLETE_COMMANDS.md - All 29 commands detailed');
  showInfo('  • INTEGRATION_GUIDE.md - Rovo Dev / Gemini CLI integration');
  showInfo('');
  showInfo('To open: cat ~/.gemini/reis/README.md or cat ~/.rovodev/reis/README.md');
}
