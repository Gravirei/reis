/**
 * REIS v2.0 Plan Validator
 * Validates PLAN.md files for structure, format, dependencies, and common issues
 */

const fs = require('fs');
const path = require('path');

/**
 * Validation result class
 */
class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  addError(type, message, line = null) {
    this.valid = false;
    this.errors.push({
      type,
      message,
      line
    });
  }

  addWarning(type, message, line = null) {
    this.warnings.push({
      type,
      message,
      line
    });
  }

  addSuggestion(message) {
    this.suggestions.push(message);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  toJSON() {
    return {
      valid: this.valid,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions
    };
  }
}

/**
 * Individual validators
 */
const validators = {
  /**
   * Validate file exists and is readable
   */
  validateFileAccess(planPath, result) {
    if (!fs.existsSync(planPath)) {
      result.addError('file_not_found', `Plan file not found: ${planPath}`);
      return false;
    }

    try {
      fs.accessSync(planPath, fs.constants.R_OK);
      return true;
    } catch (error) {
      result.addError('file_not_readable', `Plan file is not readable: ${error.message}`);
      return false;
    }
  },

  /**
   * Validate required sections exist
   */
  validateRequiredSections(content, result) {
    const lines = content.split('\n');
    const sections = {
      objective: false,
      tasks: false
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^##\s+Objective/i)) {
        sections.objective = true;
      }
      if (line.match(/^##\s+Tasks/i)) {
        sections.tasks = true;
      }
    }

    if (!sections.objective) {
      result.addWarning('missing_section', 'Missing "## Objective" section');
    }

    if (!sections.tasks) {
      result.addWarning('missing_section', 'Missing "## Tasks" section');
    }

    return sections.objective || sections.tasks;
  },

  /**
   * Validate task format (XML)
   */
  validateTaskFormat(content, result) {
    const taskRegex = /<task[^>]*>/g;
    const lines = content.split('\n');
    let hasValidTasks = false;
    let taskCount = 0;

    let match;
    while ((match = taskRegex.exec(content)) !== null) {
      taskCount++;
      const taskStart = match.index;
      const taskEnd = content.indexOf('</task>', taskStart);

      if (taskEnd === -1) {
        const lineNumber = content.substring(0, taskStart).split('\n').length;
        result.addError('task_format', 'Unclosed <task> tag', lineNumber);
        continue;
      }

      const taskBlock = content.substring(taskStart, taskEnd + 7);
      const lineNumber = content.substring(0, taskStart).split('\n').length;

      // Validate task type
      const typeMatch = taskBlock.match(/type="([^"]+)"/);
      if (typeMatch) {
        const taskType = typeMatch[1];
        const validTypes = ['auto', 'checkpoint:human-verify', 'checkpoint:decision', 'checkpoint:human-action'];
        if (!validTypes.includes(taskType)) {
          result.addError('invalid_task_type', `Invalid task type "${taskType}". Must be one of: ${validTypes.join(', ')}`, lineNumber);
        }
      }

      // Validate required elements
      if (!taskBlock.match(/<name>[^<]+<\/name>/)) {
        result.addError('missing_element', 'Task missing <name> element', lineNumber);
      }

      if (!taskBlock.match(/<action>[\s\S]*?<\/action>/)) {
        result.addError('missing_element', 'Task missing <action> element', lineNumber);
      }

      if (!taskBlock.match(/<verify>[\s\S]*?<\/verify>/)) {
        result.addWarning('missing_element', 'Task missing <verify> element - verification is recommended', lineNumber);
      }

      if (!taskBlock.match(/<done>[\s\S]*?<\/done>/)) {
        result.addWarning('missing_element', 'Task missing <done> element - completion criteria recommended', lineNumber);
      }

      // Warn on missing files
      if (!taskBlock.match(/<files>[^<]+<\/files>/)) {
        result.addWarning('missing_files', 'Task missing <files> element - specifying files helps with execution', lineNumber);
      }

      // Check for vague action descriptions
      const actionMatch = taskBlock.match(/<action>([\s\S]*?)<\/action>/);
      if (actionMatch) {
        const actionText = actionMatch[1].trim();
        if (actionText.length < 50) {
          result.addWarning('vague_action', 'Task <action> seems brief - consider adding more detail', lineNumber);
        }
      }

      hasValidTasks = true;
    }

    return { hasValidTasks, taskCount };
  },

  /**
   * Validate wave format
   */
  validateWaveFormat(content, result) {
    const lines = content.split('\n');
    const waves = [];
    let currentWave = null;
    let lastWaveNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Match wave headers: ## Wave 1: Name or ## Wave 1: Name (Size: small)
      const waveMatch = line.match(/^#{2,3}\s+Wave\s+(\d+):?\s+(.+?)(\s+\(Size:\s*(small|medium|large)\))?$/i);

      if (waveMatch) {
        const waveNumber = parseInt(waveMatch[1]);
        const waveName = waveMatch[2].trim();
        const waveSize = waveMatch[4] || 'medium';

        // Check sequential numbering
        if (waveNumber !== lastWaveNumber + 1) {
          result.addWarning('wave_numbering', `Wave ${waveNumber} is not sequential (expected ${lastWaveNumber + 1})`, lineNumber);
        }

        // Check for descriptive name
        if (waveName.length < 3) {
          result.addWarning('wave_name', `Wave ${waveNumber} has a very short name`, lineNumber);
        }

        // Validate wave size
        if (waveSize && !['small', 'medium', 'large'].includes(waveSize)) {
          result.addError('invalid_wave_size', `Invalid wave size "${waveSize}". Must be: small, medium, or large`, lineNumber);
        }

        // Save previous wave
        if (currentWave) {
          waves.push(currentWave);
        }

        currentWave = {
          number: waveNumber,
          name: waveName,
          size: waveSize,
          tasks: [],
          lineNumber
        };

        lastWaveNumber = waveNumber;
      } else if (currentWave) {
        // Count tasks in current wave
        const taskMatch = line.match(/^[-*]\s+(?:\[[ x]\]\s+)?(.+)$/) || 
                          line.match(/^\d+\.\s+(.+)$/);
        
        if (taskMatch && taskMatch[1]) {
          currentWave.tasks.push(taskMatch[1].trim());
        }

        // End wave on new heading
        if (line.startsWith('##') && !line.match(/Wave\s+\d+/i)) {
          waves.push(currentWave);
          currentWave = null;
        }
      }
    }

    // Add last wave
    if (currentWave) {
      waves.push(currentWave);
    }

    // Validate wave sizes
    const sizeLimits = {
      small: { max: 8, recommended: 4 },
      medium: { max: 12, recommended: 8 },
      large: { max: 20, recommended: 12 }
    };

    waves.forEach(wave => {
      if (wave.tasks.length === 0) {
        result.addWarning('empty_wave', `Wave ${wave.number} has no tasks`, wave.lineNumber);
      }

      const limits = sizeLimits[wave.size];
      if (limits && wave.tasks.length > limits.max) {
        result.addWarning('wave_size_exceeded', 
          `Wave ${wave.number} has ${wave.tasks.length} tasks, exceeding ${wave.size} wave limit of ${limits.max}`, 
          wave.lineNumber);
      } else if (limits && wave.tasks.length > limits.recommended) {
        result.addSuggestion(`Wave ${wave.number} has ${wave.tasks.length} tasks. Consider splitting for ${wave.size} wave (recommended max: ${limits.recommended})`);
      }
    });

    return { waves, waveCount: waves.length };
  },

  /**
   * Validate dependencies section
   */
  validateDependencies(content, result) {
    const lines = content.split('\n');
    let inDependenciesSection = false;
    const dependencies = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (line.match(/^##\s+Dependencies/i)) {
        inDependenciesSection = true;
        continue;
      }

      if (inDependenciesSection) {
        if (line.startsWith('##')) {
          inDependenciesSection = false;
          continue;
        }

        // Parse dependency entries
        if (line.startsWith('-') || line.startsWith('*')) {
          const dep = line.substring(1).trim();
          if (dep.toLowerCase() === 'none') {
            result.addSuggestion('No dependencies - this plan can run in parallel with others');
          } else {
            dependencies.push({ text: dep, lineNumber });
          }
        }
      }
    }

    return dependencies;
  },

  /**
   * Detect common issues
   */
  detectCommonIssues(content, result) {
    const lines = content.split('\n');

    // Check for vague task names in markdown format
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      const taskMatch = line.match(/^[-*]\s+(?:\[[ x]\]\s+)?(.+)$/) || 
                        line.match(/^\d+\.\s+(.+)$/);

      if (taskMatch) {
        const taskName = taskMatch[1];
        
        // Check for vague patterns
        if (taskName.match(/^(implement|add|create|setup|fix)\s+\w+$/i)) {
          result.addWarning('vague_task', `Task "${taskName}" may be too vague - consider being more specific`, lineNumber);
        }

        // Check for very short tasks
        if (taskName.length < 10) {
          result.addWarning('short_task', `Task "${taskName}" is very short - consider adding more detail`, lineNumber);
        }
      }
    }

    // Check for non-measurable success criteria
    let inSuccessCriteria = false;
    let hasMeasurableCriteria = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.match(/^##\s+Success\s+Criteria/i)) {
        inSuccessCriteria = true;
        continue;
      }

      if (inSuccessCriteria) {
        if (line.startsWith('##')) {
          inSuccessCriteria = false;
          continue;
        }

        // Look for measurable indicators
        if (line.match(/\d+\+?\s+(tests?|checks?)/i) || 
            line.match(/✅|✓/) ||
            line.match(/(pass(es|ing)?|complete|working)/i)) {
          hasMeasurableCriteria = true;
        }
      }
    }

    if (inSuccessCriteria && !hasMeasurableCriteria) {
      result.addSuggestion('Consider adding measurable success criteria (e.g., "30+ tests pass", "all features working")');
    }
  }
};

/**
 * Main validation function
 * @param {string} planPath - Path to PLAN.md file
 * @param {Object} options - Validation options
 * @returns {ValidationResult} Validation results
 */
function validatePlan(planPath, options = {}) {
  const result = new ValidationResult();
  const startTime = Date.now();

  // Step 1: Validate file access
  if (!validators.validateFileAccess(planPath, result)) {
    return result;
  }

  // Read file content
  let content;
  try {
    content = fs.readFileSync(planPath, 'utf8');
  } catch (error) {
    result.addError('read_error', `Failed to read plan file: ${error.message}`);
    return result;
  }

  // Check for empty file
  if (content.trim().length === 0) {
    result.addError('empty_file', 'Plan file is empty');
    return result;
  }

  // Step 2: Validate required sections
  validators.validateRequiredSections(content, result);

  // Step 3: Validate task format (XML tasks)
  const taskValidation = validators.validateTaskFormat(content, result);

  // Step 4: Validate wave format (markdown waves)
  const waveValidation = validators.validateWaveFormat(content, result);

  // Check if plan has at least one task or wave
  if (!taskValidation.hasValidTasks && waveValidation.waveCount === 0) {
    result.addError('no_tasks', 'Plan has no valid tasks or waves');
  }

  // Step 5: Validate dependencies
  validators.validateDependencies(content, result);

  // Step 6: Detect common issues
  validators.detectCommonIssues(content, result);

  // Performance check
  const duration = Date.now() - startTime;
  if (duration > 100) {
    result.addWarning('performance', `Validation took ${duration}ms (target: <100ms)`);
  }

  return result;
}

module.exports = {
  validatePlan,
  ValidationResult,
  validators
};
