import { ICsvFile } from "@/interfaces";
import { timer } from "rxjs";

export function serialize(csvData: any[][]) {
  return csvData.map((e) => e.join(",")).join("\n");
}

export async function downloadCsvFile({
  csvFile,
  delay = 0,
}: {
  csvFile: ICsvFile;
  delay?: number;
}) {
  // https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
  // let csvContent = "data:text/csv;charset=utf-8,";
  let csvContent = "";

  // Convert the 2D array to a comma-separated string with commas escaped and quotes added where necessary
  csvFile.data.forEach(function (rowArray) {
    let row = rowArray
      .map(function (cell) {
        if (typeof cell !== "string") {
          return cell;
        }

        // If the cell contains a comma or a double quote, add double quotes around the cell contents and escape any double quotes
        if (cell.includes(",") || cell.includes('"')) {
          cell = '"' + cell.replace(/"/g, '""') + '"';
        }
        return cell;
      })
      .join(",");
    csvContent += row + "\r\n";
  });

  // let fileData: string = "data:text/csv;charset=utf-8," + serialize(csvFile.data);
  let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // let encodedUri = encodeURI(fileData);
  let url = URL.createObjectURL(blob);

  let link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", csvFile.filename);
  document.body.appendChild(link); // Required for FF

  link.click(); // This will download the data file named "my_data.csv".

  await timer(delay).toPromise();
}

interface CsvColumnData {
  isVector: boolean;
  data: string | number | string[] | number[];
}

export function buildCsvDataOrError(columns: CsvColumnData[]) {
  let expectedRowCount: number | null = null;

  for (let column of columns) {
    if (column.isVector) {
      if (!(column.data instanceof Array)) {
        throw new Error("Vector data must be an array");
      }

      if (column.data.length === 0) {
        throw new Error("Vector data must have nonzero length");
      }

      if (!expectedRowCount) {
        expectedRowCount = column.data.length;
      } else {
        if (column.data.length !== expectedRowCount) {
          throw new Error("Vector length mismatch");
        }
      }
    } else {
      if (column.data instanceof Array) {
        throw new Error("Non-vector data must NOT be an array");
      }
    }
  }

  if (!expectedRowCount) {
    throw new Error("Must provide at least one vector");
  }

  const rows = [];

  for (let rowIndex = 0; rowIndex < expectedRowCount; ++rowIndex) {
    const row = [];

    for (let column of columns) {
      // @ts-ignore
      const val = column.isVector ? column.data[rowIndex] : column.data;

      row.push(val.toString());
    }

    rows.push(row);
  }

  return rows;
}

export function buildNamedCsvFileData(
  csvData: any[][],
  filenameSeed: string,
  chunkSize: number = 500
) {
  const chunkCount: number = Math.ceil(csvData.length / chunkSize);

  const files: ICsvFile[] = [];

  const regex = /[^a-zA-Z0-9]+/gi;
  const parsedFilenameSeed = filenameSeed.replace(regex, "_");

  const timestamp = Date.now().toString();

  for (let chunkIdx = 0; chunkIdx < chunkCount; ++chunkIdx) {
    const startIdx = chunkSize * chunkIdx;
    const endIdx = chunkSize * (chunkIdx + 1);
    files.push({
      filename: `${parsedFilenameSeed}_${timestamp}_${chunkIdx + 1}_of_${chunkCount}.csv`,
      data: csvData.slice(startIdx, endIdx),
    });
  }

  return files;
}
