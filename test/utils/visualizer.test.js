/**
 * Tests for visualizer utility
 */

const assert = require('assert');
const visualizer = require('../../lib/utils/visualizer.js');

describe('Visualizer Utility', () => {
  
  describe('createBarChart', () => {
    it('should create a basic bar chart', () => {
      const data = [
        { label: 'Wave 1', value: 45 },
        { label: 'Wave 2', value: 28 },
        { label: 'Wave 3', value: 19 }
      ];
      const result = visualizer.createBarChart(data, { colors: false });
      assert(result.includes('Wave 1'));
      assert(result.includes('Wave 2'));
      assert(result.includes('Wave 3'));
      assert(result.includes('45'));
      assert(result.includes('28'));
      assert(result.includes('19'));
    });

    it('should handle empty data', () => {
      const result = visualizer.createBarChart([]);
      assert.strictEqual(result, 'No data to display');
    });

    it('should handle null data', () => {
      const result = visualizer.createBarChart(null);
      assert.strictEqual(result, 'No data to display');
    });

    it('should handle zero values', () => {
      const data = [
        { label: 'Item 1', value: 0 },
        { label: 'Item 2', value: 0 }
      ];
      const result = visualizer.createBarChart(data, { colors: false });
      assert(result.includes('Item 1'));
      assert(result.includes('(no data)'));
    });

    it('should respect custom width', () => {
      const data = [{ label: 'Test', value: 100 }];
      const result = visualizer.createBarChart(data, { width: 20, colors: false });
      assert(result.includes('Test'));
    });

    it('should hide values when showValues is false', () => {
      const data = [{ label: 'Test', value: 50 }];
      const result = visualizer.createBarChart(data, { showValues: false, colors: false });
      assert(result.includes('Test'));
      assert(!result.includes('50'));
    });

    it('should use custom maxValue for scaling', () => {
      const data = [
        { label: 'A', value: 50 },
        { label: 'B', value: 25 }
      ];
      const result = visualizer.createBarChart(data, { maxValue: 100, colors: false });
      assert(result.includes('A'));
      assert(result.includes('B'));
    });

    it('should use custom bar character', () => {
      const data = [{ label: 'Test', value: 50 }];
      const result = visualizer.createBarChart(data, { barChar: '#', colors: false });
      assert(result.includes('#'));
    });

    it('should align labels properly', () => {
      const data = [
        { label: 'Short', value: 10 },
        { label: 'Very Long Label', value: 20 }
      ];
      const result = visualizer.createBarChart(data, { colors: false });
      const lines = result.split('\n');
      assert.strictEqual(lines.length, 2);
    });
  });

  describe('createTimeline', () => {
    it('should create a basic timeline', () => {
      const events = [
        { timestamp: new Date('2024-01-18T10:00:00'), label: 'Phase 1 Complete', status: 'success' },
        { timestamp: new Date('2024-01-18T11:30:00'), label: 'Phase 2 Complete', status: 'success' },
        { timestamp: new Date('2024-01-18T14:00:00'), label: 'Phase 3 In Progress', status: 'progress' }
      ];
      const result = visualizer.createTimeline(events, { colors: false });
      assert(result.includes('Phase 1 Complete'));
      assert(result.includes('Phase 2 Complete'));
      assert(result.includes('Phase 3 In Progress'));
      assert(result.includes('2024-01-18'));
    });

    it('should handle empty events', () => {
      const result = visualizer.createTimeline([]);
      assert.strictEqual(result, 'No events to display');
    });

    it('should handle null events', () => {
      const result = visualizer.createTimeline(null);
      assert.strictEqual(result, 'No events to display');
    });

    it('should hide dates when showDates is false', () => {
      const events = [
        { timestamp: new Date('2024-01-18T10:00:00'), label: 'Test Event', status: 'success' }
      ];
      const result = visualizer.createTimeline(events, { showDates: false, colors: false });
      assert(result.includes('Test Event'));
      assert(!result.includes('2024-01-18'));
    });

    it('should handle string timestamps', () => {
      const events = [
        { timestamp: '2024-01-18T10:00:00Z', label: 'Test', status: 'success' }
      ];
      const result = visualizer.createTimeline(events, { colors: false });
      assert(result.includes('Test'));
      assert(result.includes('2024-01-18'));
    });

    it('should truncate long labels', () => {
      const events = [
        { 
          timestamp: new Date('2024-01-18T10:00:00'), 
          label: 'This is a very long label that should be truncated because it exceeds the maximum width',
          status: 'success' 
        }
      ];
      const result = visualizer.createTimeline(events, { width: 50, colors: false });
      assert(result.includes('...'));
    });

    it('should show different status icons', () => {
      const events = [
        { timestamp: new Date(), label: 'Success', status: 'success' },
        { timestamp: new Date(), label: 'Failed', status: 'failure' },
        { timestamp: new Date(), label: 'Pending', status: 'pending' },
        { timestamp: new Date(), label: 'Progress', status: 'progress' }
      ];
      const result = visualizer.createTimeline(events, { colors: false });
      assert(result.includes('Success'));
      assert(result.includes('Failed'));
      assert(result.includes('Pending'));
      assert(result.includes('Progress'));
    });
  });

  describe('createProgressBar', () => {
    it('should create a basic progress bar', () => {
      const result = visualizer.createProgressBar(6, 10, { colors: false });
      assert(result.includes('['));
      assert(result.includes(']'));
      assert(result.includes('60%'));
      assert(result.includes('(6/10)'));
    });

    it('should handle zero total', () => {
      const result = visualizer.createProgressBar(0, 0, { colors: false });
      assert.strictEqual(result, '[No progress data]');
    });

    it('should handle 0% progress', () => {
      const result = visualizer.createProgressBar(0, 10, { colors: false });
      assert(result.includes('0%'));
      assert(result.includes('(0/10)'));
    });

    it('should handle 100% progress', () => {
      const result = visualizer.createProgressBar(10, 10, { colors: false });
      assert(result.includes('100%'));
      assert(result.includes('(10/10)'));
    });

    it('should handle values exceeding total', () => {
      const result = visualizer.createProgressBar(15, 10, { colors: false });
      assert(result.includes('100%'));
    });

    it('should hide percentage when showPercent is false', () => {
      const result = visualizer.createProgressBar(5, 10, { showPercent: false, colors: false });
      assert(!result.includes('%'));
      assert(result.includes('(5/10)'));
    });

    it('should use blocks style', () => {
      const result = visualizer.createProgressBar(5, 10, { style: 'blocks', colors: false });
      assert(result.includes('▓') || result.includes('░'));
    });

    it('should use dots style', () => {
      const result = visualizer.createProgressBar(5, 10, { style: 'dots', colors: false });
      assert(result.includes('●') || result.includes('○'));
    });

    it('should use bar style by default', () => {
      const result = visualizer.createProgressBar(5, 10, { colors: false });
      assert(result.includes('█') || result.includes('░'));
    });

    it('should respect custom width', () => {
      const result = visualizer.createProgressBar(5, 10, { width: 20, colors: false });
      assert(result.includes('['));
      assert(result.includes(']'));
    });

    it('should show ETA when provided', () => {
      const result = visualizer.createProgressBar(5, 10, { eta: 300000, colors: false });
      assert(result.includes('ETA'));
      assert(result.includes('5m'));
    });

    it('should handle negative current values', () => {
      const result = visualizer.createProgressBar(-5, 10, { colors: false });
      assert(result.includes('0%'));
    });
  });

  describe('createDistribution', () => {
    it('should create a distribution chart', () => {
      const data = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const result = visualizer.createDistribution(data, { colors: false });
      assert(result.includes('Statistics'));
      assert(result.includes('Mean'));
      assert(result.includes('Median'));
      assert(result.includes('StdDev'));
      assert(result.includes('Min'));
      assert(result.includes('Max'));
    });

    it('should handle empty data', () => {
      const result = visualizer.createDistribution([]);
      assert.strictEqual(result, 'No data to display');
    });

    it('should handle null data', () => {
      const result = visualizer.createDistribution(null);
      assert.strictEqual(result, 'No data to display');
    });

    it('should hide statistics when showStats is false', () => {
      const data = [10, 20, 30, 40, 50];
      const result = visualizer.createDistribution(data, { showStats: false, colors: false });
      assert(!result.includes('Statistics'));
    });

    it('should use custom number of bins', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = visualizer.createDistribution(data, { bins: 5, colors: false });
      const lines = result.split('\n');
      assert(lines.length > 5);
    });

    it('should handle single value', () => {
      const data = [42];
      const result = visualizer.createDistribution(data, { colors: false });
      assert(result.includes('42.0'));
    });

    it('should handle identical values', () => {
      const data = [10, 10, 10, 10, 10];
      const result = visualizer.createDistribution(data, { colors: false });
      assert(result.includes('Mean'));
      assert(result.includes('10.00'));
    });
  });

  describe('createTable', () => {
    it('should create a basic table', () => {
      const headers = ['Name', 'Value', 'Status'];
      const rows = [
        ['Item 1', '100', 'Active'],
        ['Item 2', '200', 'Inactive'],
        ['Item 3', '150', 'Active']
      ];
      const result = visualizer.createTable(headers, rows, { colors: false });
      assert(result.includes('Name'));
      assert(result.includes('Value'));
      assert(result.includes('Status'));
      assert(result.includes('Item 1'));
      assert(result.includes('100'));
    });

    it('should handle empty headers', () => {
      const result = visualizer.createTable([], []);
      assert.strictEqual(result, 'No table headers provided');
    });

    it('should handle null headers', () => {
      const result = visualizer.createTable(null, []);
      assert.strictEqual(result, 'No table headers provided');
    });

    it('should handle empty rows', () => {
      const headers = ['Col1', 'Col2'];
      const result = visualizer.createTable(headers, [], { colors: false });
      assert(result.includes('Col1'));
      assert(result.includes('Col2'));
    });

    it('should hide borders when borders is false', () => {
      const headers = ['A', 'B'];
      const rows = [['1', '2']];
      const result = visualizer.createTable(headers, rows, { borders: false, colors: false });
      assert(!result.includes('─'));
      assert(!result.includes('│'));
    });

    it('should align columns right', () => {
      const headers = ['Name', 'Number'];
      const rows = [['A', '100'], ['BB', '50']];
      const result = visualizer.createTable(headers, rows, { 
        alignments: ['left', 'right'],
        colors: false 
      });
      assert(result.includes('Name'));
      assert(result.includes('Number'));
    });

    it('should align columns center', () => {
      const headers = ['Col'];
      const rows = [['Value']];
      const result = visualizer.createTable(headers, rows, { 
        alignments: ['center'],
        colors: false 
      });
      assert(result.includes('Col'));
    });

    it('should use fixed column widths', () => {
      const headers = ['A', 'B'];
      const rows = [['Short', 'X']];
      const result = visualizer.createTable(headers, rows, { 
        columnWidths: [20, 10],
        colors: false 
      });
      assert(result.includes('A'));
      assert(result.includes('B'));
    });

    it('should handle null values in cells', () => {
      const headers = ['Col1', 'Col2'];
      const rows = [['Value', null], [null, 'Value']];
      const result = visualizer.createTable(headers, rows, { colors: false });
      assert(result.includes('Value'));
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      assert.strictEqual(visualizer.formatDuration(5000), '5s');
      assert.strictEqual(visualizer.formatDuration(45000), '45s');
    });

    it('should format minutes', () => {
      assert.strictEqual(visualizer.formatDuration(60000), '1m');
      assert.strictEqual(visualizer.formatDuration(90000), '1m 30s');
      assert.strictEqual(visualizer.formatDuration(300000), '5m');
    });

    it('should format hours', () => {
      assert.strictEqual(visualizer.formatDuration(3600000), '1h');
      assert.strictEqual(visualizer.formatDuration(5400000), '1h 30m');
      assert.strictEqual(visualizer.formatDuration(7200000), '2h');
    });

    it('should format days', () => {
      assert.strictEqual(visualizer.formatDuration(86400000), '1d');
      assert.strictEqual(visualizer.formatDuration(90000000), '1d 1h');
      assert.strictEqual(visualizer.formatDuration(172800000), '2d');
    });

    it('should handle zero', () => {
      assert.strictEqual(visualizer.formatDuration(0), '0s');
    });

    it('should handle negative values', () => {
      assert.strictEqual(visualizer.formatDuration(-1000), '0s');
    });

    it('should omit zero components', () => {
      assert.strictEqual(visualizer.formatDuration(3661000), '1h 1m');
    });
  });

  describe('formatTimestamp', () => {
    it('should format datetime by default', () => {
      const date = new Date('2024-01-18T15:30:45');
      const result = visualizer.formatTimestamp(date);
      assert(result.includes('2024-01-18'));
      assert(result.includes('15:30'));
    });

    it('should format date only', () => {
      const date = new Date('2024-01-18T15:30:45');
      const result = visualizer.formatTimestamp(date, 'date');
      assert.strictEqual(result, '2024-01-18');
    });

    it('should format time only', () => {
      const date = new Date('2024-01-18T15:30:45');
      const result = visualizer.formatTimestamp(date, 'time');
      assert.strictEqual(result, '15:30:45');
    });

    it('should handle invalid date', () => {
      const result = visualizer.formatTimestamp(new Date('invalid'));
      assert.strictEqual(result, 'Invalid Date');
    });

    it('should handle non-date input', () => {
      const result = visualizer.formatTimestamp('not a date');
      assert.strictEqual(result, 'Invalid Date');
    });

    it('should pad single digits', () => {
      const date = new Date('2024-01-05T09:05:03');
      const result = visualizer.formatTimestamp(date, 'datetime');
      assert(result.includes('2024-01-05'));
      assert(result.includes('09:05'));
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      assert.strictEqual(visualizer.truncateText('Hello', 10), 'Hello');
    });

    it('should truncate long text', () => {
      const result = visualizer.truncateText('This is a very long text', 10);
      assert.strictEqual(result, 'This is...');
      assert.strictEqual(result.length, 10);
    });

    it('should handle text exactly at max length', () => {
      const result = visualizer.truncateText('1234567890', 10);
      assert.strictEqual(result, '1234567890');
    });

    it('should handle empty text', () => {
      assert.strictEqual(visualizer.truncateText('', 10), '');
    });

    it('should handle null text', () => {
      assert.strictEqual(visualizer.truncateText(null, 10), '');
    });

    it('should handle undefined text', () => {
      assert.strictEqual(visualizer.truncateText(undefined, 10), '');
    });
  });

  describe('colorizeStatus', () => {
    it('should return success icon for success status', () => {
      const result = visualizer.colorizeStatus('success', false);
      assert.strictEqual(result, '✓');
    });

    it('should return success icon for complete status', () => {
      const result = visualizer.colorizeStatus('complete', false);
      assert.strictEqual(result, '✓');
    });

    it('should return failure icon for failure status', () => {
      const result = visualizer.colorizeStatus('failure', false);
      assert.strictEqual(result, '✗');
    });

    it('should return failure icon for error status', () => {
      const result = visualizer.colorizeStatus('error', false);
      assert.strictEqual(result, '✗');
    });

    it('should return progress icon for progress status', () => {
      const result = visualizer.colorizeStatus('progress', false);
      assert.strictEqual(result, '⧗');
    });

    it('should return pending icon for pending status', () => {
      const result = visualizer.colorizeStatus('pending', false);
      assert.strictEqual(result, '○');
    });

    it('should return warning icon for warning status', () => {
      const result = visualizer.colorizeStatus('warning', false);
      assert.strictEqual(result, '⚠');
    });

    it('should return default icon for unknown status', () => {
      const result = visualizer.colorizeStatus('unknown', false);
      assert.strictEqual(result, '●');
    });

    it('should handle case insensitive status', () => {
      assert.strictEqual(visualizer.colorizeStatus('SUCCESS', false), '✓');
      assert.strictEqual(visualizer.colorizeStatus('FAILURE', false), '✗');
    });

    it('should handle empty status', () => {
      const result = visualizer.colorizeStatus('', false);
      assert.strictEqual(result, '●');
    });

    it('should handle null status', () => {
      const result = visualizer.colorizeStatus(null, false);
      assert.strictEqual(result, '●');
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const data = [10, 20, 30, 40, 50];
      const stats = visualizer.calculateStats(data);
      assert.strictEqual(stats.mean, 30);
      assert.strictEqual(stats.median, 30);
      assert.strictEqual(stats.min, 10);
      assert.strictEqual(stats.max, 50);
      assert(stats.stdDev > 0);
    });

    it('should handle single value', () => {
      const stats = visualizer.calculateStats([42]);
      assert.strictEqual(stats.mean, 42);
      assert.strictEqual(stats.median, 42);
      assert.strictEqual(stats.min, 42);
      assert.strictEqual(stats.max, 42);
      assert.strictEqual(stats.stdDev, 0);
    });

    it('should handle even number of values for median', () => {
      const stats = visualizer.calculateStats([10, 20, 30, 40]);
      assert.strictEqual(stats.median, 25);
    });

    it('should handle odd number of values for median', () => {
      const stats = visualizer.calculateStats([10, 20, 30]);
      assert.strictEqual(stats.median, 20);
    });

    it('should handle empty array', () => {
      const stats = visualizer.calculateStats([]);
      assert.strictEqual(stats.mean, 0);
      assert.strictEqual(stats.median, 0);
      assert.strictEqual(stats.stdDev, 0);
      assert.strictEqual(stats.min, 0);
      assert.strictEqual(stats.max, 0);
    });

    it('should handle null input', () => {
      const stats = visualizer.calculateStats(null);
      assert.strictEqual(stats.mean, 0);
      assert.strictEqual(stats.median, 0);
    });

    it('should handle negative values', () => {
      const stats = visualizer.calculateStats([-10, -5, 0, 5, 10]);
      assert.strictEqual(stats.mean, 0);
      assert.strictEqual(stats.median, 0);
      assert.strictEqual(stats.min, -10);
      assert.strictEqual(stats.max, 10);
    });

    it('should handle floating point values', () => {
      const stats = visualizer.calculateStats([1.5, 2.5, 3.5]);
      assert.strictEqual(stats.mean, 2.5);
      assert.strictEqual(stats.median, 2.5);
      assert.strictEqual(stats.min, 1.5);
      assert.strictEqual(stats.max, 3.5);
    });
  });

});
