/** Compares MAJOR.MINOR.PATCH strings; missing or non-numeric parts count as 0. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) =>
    v.split('.').map(p => Number.parseInt(p, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

export function isBelowMinimum(
  current: string,
  minimum: string | null | undefined,
): boolean {
  return !!minimum && compareVersions(current, minimum) < 0;
}
