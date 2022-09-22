export function decodeEnum(str: string): string {
  if (str === "") return "";
  return str
    .split("_")
    .map(x => x[0].toLocaleUpperCase() + x.slice(1).toLocaleLowerCase())
    .join(" ");
}
