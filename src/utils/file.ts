import { ITextFile } from '@/interfaces';
import * as Papa from 'papaparse';
import { timer } from 'rxjs';

export async function toBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export async function generateThumbnail(file: File, size: number = 100): Promise<string> {
  // const scaleRatio = Math.min(100, 100) / Math.max(file.width, file.height)
  const reader = new FileReader();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const scaleRatio = Math.min(size, size) / Math.max(img.width, img.height);
        const w = img.width * scaleRatio;
        const h = img.height * scaleRatio;
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        return resolve(canvas.toDataURL('image/png', 0.7));
      };
      // @ts-ignore
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function readJSONFile(file: File): Promise<any> {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = function (event) {
      // @ts-ignore
      resolve(JSON.parse(event.target.result));
    };
    reader.readAsText(file);
  });
}

export async function readCsvFile(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
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
}

export async function downloadTextFile({
  textFile,
  delay = 0,
}: {
  textFile: ITextFile;
  delay?: number;
}) {
  const textContent = textFile.data;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });

  // let encodedUri = encodeURI(fileData);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', textFile.filename);
  document.body.appendChild(link); // Required for FF

  link.click(); // This will download the data file named "my_data.csv".

  await timer(delay).toPromise();
}
