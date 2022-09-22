export function abbreviateString(str: string, start: number, end: number): string {
  return str.split('-').join('').substring(start,end);
}