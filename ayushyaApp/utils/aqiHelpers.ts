// utils/aqiHelpers.ts
// ✅ No changes needed — pure logic, works in both web and RN
export function getAqiClass(val: number): string {
  if (val <= 50) return 'good';
  if (val <= 100) return 'moderate';
  return 'poor';
}

export function getAqiLabel(val: number): string {
  if (val <= 50) return 'Good';
  if (val <= 100) return 'Moderate';
  return 'Poor';
}

export function getSegmentClass(val: number): string {
  if (val <= 50) return 'g';
  if (val <= 100) return 'm';
  return 'p';
}