const fs = require("fs");
const path = require("path");

export function getFileText(directory: string, filename: string) {
  const file = path.join(__dirname, directory, filename);
  const fdr = fs.readFileSync(file, "utf8", (err: any, data: any) => data);

  return fdr;
}
