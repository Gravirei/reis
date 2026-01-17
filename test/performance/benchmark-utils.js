/**
 * Performance Benchmark Utilities
 * High-precision timing and performance validation
 */

/**
 * Measure execution time of async function with multiple iterations
 * @param {Function} fn - Async function to measure
 * @param {number} iterations - Number of times to run (default: 10)
 * @param {Function} setup - Optional setup function run before each iteration
 * @param {Function} teardown - Optional teardown function run after each iteration
 * @returns {Object} Performance metrics (avg, min, max, median, p95)
 */
async function measureTime(fn, iterations = 10, setup = null, teardown = null) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    // Setup
    if (setup) await setup();
    
    // Measure
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    
    const durationMs = Number(end - start) / 1_000_000; // Convert to ms
    times.push(durationMs);
    
    // Teardown
    if (teardown) await teardown();
    
    // Small delay to prevent CPU throttling
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  
  return {
    avg: sum / times.length,
    min: times[0],
    max: times[times.length - 1],
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
    all: times
  };
}

/**
 * Measure memory usage during function execution
 * @param {Function} fn - Function to measure
 * @returns {Object} Memory usage metrics
 */
async function measureMemory(fn) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const before = process.memoryUsage();
  await fn();
  const after = process.memoryUsage();
  
  return {
    heapUsed: (after.heapUsed - before.heapUsed) / 1024 / 1024, // MB
    heapTotal: (after.heapTotal - before.heapTotal) / 1024 / 1024, // MB
    external: (after.external - before.external) / 1024 / 1024, // MB
    rss: (after.rss - before.rss) / 1024 / 1024 // MB
  };
}

/**
 * Assert performance target met
 * @param {Object} result - Result from measureTime()
 * @param {number} targetMs - Target time in milliseconds
 * @param {string} description - Test description
 * @param {string} metric - Which metric to check (avg, p95, max)
 */
function assertPerformance(result, targetMs, description, metric = 'avg') {
  const actual = result[metric];
  const pass = actual <= targetMs;
  const status = pass ? '✓' : '✗';
  
  console.log(`  ${status} ${description}: ${actual.toFixed(2)}ms (target: ${targetMs}ms, metric: ${metric})`);
  
  if (!pass) {
    throw new Error(
      `Performance regression: ${description} ${metric}=${actual.toFixed(2)}ms exceeds target ${targetMs}ms`
    );
  }
}

/**
 * Assert memory usage is acceptable
 * @param {Object} result - Result from measureMemory()
 * @param {number} targetMB - Target memory in MB
 * @param {string} description - Test description
 */
function assertMemory(result, targetMB, description) {
  const actual = result.heapUsed;
  const pass = actual <= targetMB;
  const status = pass ? '✓' : '✗';
  
  console.log(`  ${status} ${description}: ${actual.toFixed(2)}MB (target: ${targetMB}MB)`);
  
  if (!pass) {
    throw new Error(
      `Memory regression: ${description} used ${actual.toFixed(2)}MB exceeds target ${targetMB}MB`
    );
  }
}

/**
 * Create performance report
 * @param {Object} benchmarks - Map of benchmark name to results
 * @returns {string} Formatted report
 */
function generateReport(benchmarks) {
  let report = '\n=== Performance Benchmark Report ===\n\n';
  
  Object.entries(benchmarks).forEach(([name, result]) => {
    report += `${name}:\n`;
    report += `  Average: ${result.avg.toFixed(2)}ms\n`;
    report += `  Median:  ${result.median.toFixed(2)}ms\n`;
    report += `  P95:     ${result.p95.toFixed(2)}ms\n`;
    report += `  Min:     ${result.min.toFixed(2)}ms\n`;
    report += `  Max:     ${result.max.toFixed(2)}ms\n`;
    report += `\n`;
  });
  
  return report;
}

module.exports = {
  measureTime,
  measureMemory,
  assertPerformance,
  assertMemory,
  generateReport
};
