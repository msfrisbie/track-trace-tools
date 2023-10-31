import { IAtomicService } from "@/interfaces";
// import pdfJs from "pdfjs-dist/build/pdf.js";

// UNUSED
class PdfManager implements IAtomicService {
    initialized: boolean = false;

    async init() {
      // Retrieving the worker script is a major pain.
      // This needs to be resolved before pdf.js is realistic

      // if (this.initialized) {
      //     return;
      // }

      // this.initialized = true;

      // const workerSrc = await getUrl(
      //     require("@/assets/scripts/pdf.worker.js")
      // );

      // pdfJs.GlobalWorkerOptions.workerSrc = workerSrc;
    }

  // async getDocument(url: string) {
  //     return pdfJs.getDocument(url);
  // }
}

export const pdfManager = new PdfManager();

// // Example
// // https://codesandbox.io/s/f6qss?file=/src/components/PdfViewer.vue:265-284
// const pdf = await pdfManager.getDocument(blobUrl);

// console.log(pdf);

// // get all pages text
// // var maxPages = pdf.pdfInfo.numPages;
// // var countPromises = []; // collecting all page promises
// // for (var j = 1; j <= maxPages; j++) {
// //   var page = pdf.getPage(j);

// //   var txt = "";
// //   countPromises.push(
// //     page.then(function (page: any) {
// //       // add page promise
// //       var textContent = page.getTextContent();
// //       console.log(textContent);

// //       // return textContent.then(function (text: any) {
// //       //   // return content promise
// //       //   return text.items
// //       //     .map(function (s: any) {
// //       //       return s.str;
// //       //     })
// //       //     .join(""); // value page text
// //       // });
// //     })
// //   );
// // }
// // // Wait for all pages and join text
// // return Promise.all(countPromises).then(function (texts) {
// //   return texts.join("");
// // });
