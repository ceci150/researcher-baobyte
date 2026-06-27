export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function titleCaseStatus(value: string): string {
  return value
    .split(/[- ]/g)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
}
