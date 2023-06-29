import { DOLLAR_NUMBER_REGEX, MessageType, METRC_TAG_REGEX, WEIGHT_NUMBER_REGEX } from "@/consts";
import { ICsvFile } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
import { toastManager } from "@/modules/toast-manager.module";
import Papa from "papaparse";
import { timer } from "rxjs";

export const clientCsvKeys: string[] = [
  "CSV_APPLY_BUTTON_ATTRIBUTE",
  "INTERMEDIATE_CSV_ATTRIBUTE",
  "TTT_CONTAINER_ATTRIBUTE",
  "DESTINATION_SELECTOR",
  "PACKAGE_ROW_SELECTOR",
  "UPLOAD_CSV_INPUT_SELECTOR",
  "CSV_INPUT_CONTAINER_SELECTOR",
  "PACKAGE_TAG_INPUT_SELECTOR",
  "PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR",
  "PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR",
  "PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR",
];

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

export async function getMergedCsvDataOrError(input: HTMLInputElement): Promise<string[][]> {
  if (!input.files) {
    throw new Error("Bad files");
  }

  const mergedRows: string[][] = [];

  for (let f of input.files) {
    const rows: string[][] = await new Promise((resolve, reject) => {
      Papa.parse(f, {
        header: false,
        complete: (results: Papa.ParseResult<string[]>) => {
          const rows: string[][] = results.data.map((x) => x.map((y) => y.trim()));

          resolve(rows);
        },
        error(e) {
          reject(e);
        },
      });
    });

    rows.map((row) => mergedRows.push(row));
  }

  return mergedRows;
}

export async function propagateCsv(destination: HTMLElement) {
  analyticsManager.track(MessageType.CSV_AUTOFILL_UPLOAD);

  const values = clientBuildManager.validateAndGetValuesOrError(clientCsvKeys);

  const intermediateCsvInput: HTMLInputElement | null = destination.querySelector(
    `input[${values.INTERMEDIATE_CSV_ATTRIBUTE}]`
  );

  if (!intermediateCsvInput || !intermediateCsvInput.files) {
    throw new Error("Cannot find intermediate input");
  }

  const csvInput: HTMLInputElement | null = destination.querySelector(
    values.UPLOAD_CSV_INPUT_SELECTOR
  );

  if (!csvInput) {
    throw new Error("Unable to match CSV input");
  }

  const mergedRows: string[][] = await getMergedCsvDataOrError(intermediateCsvInput);

  if (!mergedRows.length) {
    toastManager.openToast(`The CSVs you added are empty.`, {
      title: "CSV Formatting Error",
      autoHideDelay: 5000,
      variant: "danger",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });

    return;
  }

  let formattingErrorCount = 0;

  for (const [idx, row] of mergedRows.entries()) {
    if (!row[0]) {
      if (formattingErrorCount < 5) {
        toastManager.openToast(
          `Row ${idx} is missing a tag value
        
        ${JSON.stringify(row)}`,
          {
            title: "CSV Formatting Error",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );
      }
      formattingErrorCount++;
    } else {
      if (!row[0].match(METRC_TAG_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid tag
        
        ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "danger",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }
    }

    if (!row[1]) {
      if (formattingErrorCount < 5) {
        toastManager.openToast(
          `Row ${idx} is missing a weight value
        
        ${JSON.stringify(row)}`,
          {
            title: "CSV Formatting Error",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );
      }
      formattingErrorCount++;
    } else {
      if (!row[1].match(WEIGHT_NUMBER_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid weight
        
        ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }
    }

    if (!row[2]) {
      if (formattingErrorCount < 5) {
        toastManager.openToast(
          `Row ${idx} is missing a unit of measure
        
        ${JSON.stringify(row)}`,
          {
            title: "CSV Formatting Error",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );
      }
      formattingErrorCount++;
    } else {
      if (
        !["Pounds", "Grams", "Kilograms", "Ounces"]
          .map((x) => x.toLocaleLowerCase())
          .includes(row[2].toLocaleLowerCase())
      ) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid weight
        
        ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }
    }

    if (!row[3]) {
      if (formattingErrorCount < 5) {
        toastManager.openToast(
          `Row ${idx} is missing a wholesale value
        
        ${JSON.stringify(row)}`,
          {
            title: "CSV Formatting Error",
            autoHideDelay: 5000,
            variant: "warning",
            appendToast: true,
            toaster: "ttt-toaster",
            solid: true,
          }
        );
      }
      formattingErrorCount++;
    } else {
      if (!row[3].match(DOLLAR_NUMBER_REGEX)) {
        if (formattingErrorCount < 5) {
          toastManager.openToast(
            `Row ${idx} does not have a valid wholesale dollar amount
        
        ${JSON.stringify(row)}`,
            {
              title: "CSV Formatting Error",
              autoHideDelay: 5000,
              variant: "warning",
              appendToast: true,
              toaster: "ttt-toaster",
              solid: true,
            }
          );
        }
        formattingErrorCount++;
      }
    }
  }

  if (formattingErrorCount > 0) {
    toastManager.openToast(`Detected ${formattingErrorCount} CSV formatting errors`, {
      title: "CSV Formatting Error",
      autoHideDelay: 5000,
      variant: "warning",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }

  const blob = new Blob([mergedRows.map((row) => row[0]).join("\n")], {
    type: "text/csv",
  });

  const dT = new DataTransfer();
  dT.items.add(new File([blob], "output.csv"));

  csvInput.files = dT.files;

  csvInput.dispatchEvent(new Event("change"));
}

export async function applyTransferCsvDataToMetrcModal(destination: HTMLElement) {
  analyticsManager.track(MessageType.CSV_AUTOFILL_FILL);
  const values = clientBuildManager.validateAndGetValuesOrError(clientCsvKeys);

  const input: HTMLInputElement | null = destination.querySelector(
    `input[${values.INTERMEDIATE_CSV_ATTRIBUTE}]`
  );

  if (!input || !input.files) {
    throw new Error("Bad input");
  }

  const mergedRows: string[][] = await getMergedCsvDataOrError(input);

  const packages = [...destination.querySelectorAll(values.PACKAGE_ROW_SELECTOR)];

  if (packages.length !== mergedRows.length) {
    toastManager.openToast(
      `Mismatch detected: 
      
      ${packages.length} packages, 
      ${mergedRows.length} CSV rows.
    
      This can occur when a package tag in the CSV is not eligible for transfer`,
      {
        title: "CSV Row Count Error",
        autoHideDelay: 5000,
        variant: "warning",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );
  }

  let successRowCount = 0;

  for (const pkg of packages) {
    let autofillSuccess = true;

    const packageTagInput: HTMLInputElement | null = pkg.querySelector(
      values.PACKAGE_TAG_INPUT_SELECTOR
    );

    if (!packageTagInput) {
      toastManager.openToast(`Unable to autofill package tag input`, {
        title: "CSV Autofill Error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
      autofillSuccess = false;

      throw new Error("Could not locate package tag input");
    }

    if (!packageTagInput.value) {
      continue;
    }

    let matchingRow = null;
    for (let row of mergedRows) {
      if (row[0] === packageTagInput.value) {
        matchingRow = row;
        break;
      }
    }

    if (!matchingRow) {
      toastManager.openToast(`Could not match row for ${packageTagInput.value}`, {
        title: "CSV Autofill Error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
      autofillSuccess = false;
      console.error(`Could not match row for ${packageTagInput.value}`);
      continue;
    }

    const grossWeightInput: HTMLInputElement | null = pkg.querySelector(
      values.PACKAGE_GROSS_WEIGHT_INPUT_SELECTOR
    );

    if (grossWeightInput && typeof matchingRow[1] === "string") {
      grossWeightInput.value = matchingRow[1].replace(",", "");
    } else {
      toastManager.openToast(`Could not autofill gross weight input: ${matchingRow[1]}`, {
        title: "CSV Autofill Error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
      autofillSuccess = false;
    }

    const grossUnitOfWeightSelect: HTMLSelectElement | null = pkg.querySelector(
      values.PACKAGE_GROSS_UNIT_OF_WEIGHT_ID_SELECT_SELECTOR
    );

    if (grossUnitOfWeightSelect) {
      const options = [...grossUnitOfWeightSelect.querySelectorAll("option")];
      let matchingOption = null;
      for (const option of options) {
        if (!matchingRow[2]) {
          break;
        }
        if (
          option.getAttribute("label")?.toLocaleLowerCase() === matchingRow[2].toLocaleLowerCase()
        ) {
          matchingOption = option;
          grossUnitOfWeightSelect.value = option.value;
          grossUnitOfWeightSelect.dispatchEvent(new Event("change"));
          break;
        }
      }

      if (!matchingOption) {
        toastManager.openToast(`Could not autofill unit of measure: ${matchingRow[2]}`, {
          title: "CSV Autofill Error",
          autoHideDelay: 5000,
          variant: "danger",
          appendToast: true,
          toaster: "ttt-toaster",
          solid: true,
        });
        autofillSuccess = false;
        console.error("Unable to match");
      }
    }

    const wholesalePriceInput: HTMLInputElement | null = pkg.querySelector(
      values.PACKAGE_WHOLESALE_PRICE_INPUT_SELECTOR
    );

    if (wholesalePriceInput && typeof matchingRow[3] === "string") {
      wholesalePriceInput.value = matchingRow[3].replace("$", "").replace(",", "");
    } else {
      toastManager.openToast(`Could not autofill wholesale value: ${matchingRow[3]}`, {
        title: "CSV Autofill Error",
        autoHideDelay: 5000,
        variant: "danger",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      });
      autofillSuccess = false;
    }

    if (autofillSuccess) {
      successRowCount++;
    }
  }

  if (successRowCount === mergedRows.length) {
    toastManager.openToast(
      `Successfully autofilled ${successRowCount} of ${mergedRows.length} rows`,
      {
        title: "CSV Autofill Finished",
        autoHideDelay: 5000,
        variant: "success",
        appendToast: true,
        toaster: "ttt-toaster",
        solid: true,
      }
    );
  } else if (successRowCount > 0) {
    toastManager.openToast(`Partially autofilled ${successRowCount} of ${mergedRows.length} rows`, {
      title: "CSV Autofill Finished",
      autoHideDelay: 5000,
      variant: "warning",
      appendToast: true,
      toaster: "ttt-toaster",
      solid: true,
    });
  }
}
