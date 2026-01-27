/**
 * Example test for helper functions
 * This demonstrates testing pure functions without React components
 */

// Example helper function to test
const formatRestTime = (seconds: number): string => {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s > 0 ? s + 's' : ''}`;
};

const formatWeight = (weight: number): string => {
  if (!weight && weight !== 0) return '-';
  const w = Number(weight);
  if (isNaN(w)) return '-';
  if (Math.abs(w % 1) < 0.0000001) return Math.round(w).toString();
  return parseFloat(w.toFixed(2)).toString();
};

describe('Helper Functions', () => {
  describe('formatRestTime', () => {
    it('should return "-" for 0 or falsy values', () => {
      expect(formatRestTime(0)).toBe('-');
      expect(formatRestTime(null as any)).toBe('-');
    });

    it('should format seconds less than 60', () => {
      expect(formatRestTime(30)).toBe('30s');
      expect(formatRestTime(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatRestTime(90)).toBe('1m 30s');
      expect(formatRestTime(120)).toBe('2m');
      expect(formatRestTime(125)).toBe('2m 5s');
    });

    it('should handle large values', () => {
      expect(formatRestTime(3600)).toBe('60m');
      expect(formatRestTime(3661)).toBe('61m 1s');
    });
  });

  describe('formatWeight', () => {
    it('should return "-" for null or undefined', () => {
      expect(formatWeight(null as any)).toBe('-');
      expect(formatWeight(undefined as any)).toBe('-');
    });

    it('should return "0" for zero', () => {
      expect(formatWeight(0)).toBe('0');
    });

    it('should format whole numbers', () => {
      expect(formatWeight(100)).toBe('100');
      expect(formatWeight(50)).toBe('50');
    });

    it('should format decimal numbers to 2 places', () => {
      expect(formatWeight(100.5)).toBe('100.5');
      expect(formatWeight(100.55)).toBe('100.55');
      expect(formatWeight(100.555)).toBe('100.56');
    });

    it('should handle very small decimals', () => {
      expect(formatWeight(0.0000001)).toBe('0');
    });
  });
});
