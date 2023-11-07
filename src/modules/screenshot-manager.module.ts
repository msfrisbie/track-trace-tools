import { MessageType } from '@/consts';
import { IAtomicService, IAuthState, IBackgroundScriptScreenshotUploadData } from '@/interfaces';
import html2canvas from 'html2canvas';
import { analyticsManager } from './analytics-manager.module';
import { authManager } from './auth-manager.module';

class ScreenshotManager implements IAtomicService {
  async init() {}

  async takeScreenshot({
    downloadFile,
    useBackground,
    useLegacyScreenshot,
  }: {
    downloadFile: boolean;
    useBackground: boolean;
    useLegacyScreenshot: boolean;
  }) {
    analyticsManager.track(MessageType.CLICKED_SCREENSHOT_BUTTON);

    // toastManager.openToast(`Preparing screenshot, sit tight...`, {
    //     title: "T3",
    //     autoHideDelay: 500,
    //     variant: "primary",
    //     appendToast: true,
    //     toaster: "ttt-toaster",
    //     solid: true,
    // });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const authState: IAuthState | null = await authManager.authStateOrNull();

    if (authState) {
      // This does not work on firefox background
      // if (useBackground) {
      //     const result = await messageBus.sendMessageToBackground(
      //         MessageType.CAPTURE_AND_UPLOAD_SCREENSHOT,
      //         this.getStaticScreenshotUploadData(authState)
      //     );
      //     if (result.data.success) {
      //         this.naviagteToScreenshot(result.data.response.uuid);
      //     } else {
      //         toastManager.openToast(`Something went wrong, try again.`, {
      //             title: "Screenshot Error",
      //             autoHideDelay: 5000,
      //             variant: "danger",
      //             appendToast: true,
      //             toaster: "ttt-toaster",
      //             solid: true,
      //         });
      //     }
      // } else {
      // }
      //   try {
      //     const response = await this.generateScreenshot(
      //       { downloadFile, useBackground, useLegacyScreenshot },
      //       this.getStaticScreenshotUploadData(authState)
      //     );
      //     if (!response.uuid) {
      //       throw new Error("Screenshot failed");
      //     }
      //     this.naviagteToScreenshot(response.uuid);
      //   } catch (e) {
      //     console.error(e);
      //     toastManager.openToast(`Something went wrong, try again.`, {
      //       title: "Screenshot Error",
      //       autoHideDelay: 5000,
      //       variant: "danger",
      //       appendToast: true,
      //       toaster: "ttt-toaster",
      //       solid: true
      //     });
      //   }
    } else {
      console.error('Cannot upload, Missing authstate');
    }
  }

  async generateScreenshot(
    {
      downloadFile,
      useBackground,
      useLegacyScreenshot,
    }: { downloadFile: boolean; useBackground: boolean; useLegacyScreenshot: boolean },
    screenshotUploadData: IBackgroundScriptScreenshotUploadData
  ) {
    const canvas = await this.getPaintedCanvas(useLegacyScreenshot);
    const blob = await this.getBlobFromCanvas(canvas);

    if (downloadFile) {
      // TODO: does this work in bg?
      await this.saveBlobAsImage(blob);
    }

    // if (useBackground) {
    return this.sendImageToServerFromBackgroundScript(blob, screenshotUploadData);
    // } else {
    // return this.sendImageToServerFromContentScript(blob, screenshotUploadData);
    // }
  }

  private async getPaintedCanvas(useLegacyScreenshot: boolean): Promise<HTMLCanvasElement> {
    if (useLegacyScreenshot) {
      return this.htmlScreenshot();
    }
    return this.displayMediaScreenshot();
  }

  // @ts-ignore
  private async htmlScreenshot(): Promise<HTMLCanvasElement> {
    document.body.classList.add('screenshot');

    await new Promise((resolve) => setTimeout(resolve, 100));

    // https://ourcodeworld.com/articles/read/415/how-to-create-a-screenshot-of-your-website-with-javascript-using-html2canvas
    const canvas = await html2canvas(document.body);

    document.body.classList.remove('screenshot');

    return canvas;
  }

  private async displayMediaScreenshot(): Promise<HTMLCanvasElement> {
    // https://www.webrtc-experiment.com/getDisplayMedia/
    const getDisplayMediaConstraints = {
      video: {
        // frameRate: 5,
        // width: 1920,
        // height: 1080,
        // displaySurface: "window",
        // logicalSurface: true,
      },
      audio: false,
    };

    // @ts-ignore
    const stream = await navigator.mediaDevices.getDisplayMedia(getDisplayMediaConstraints);
    const track = stream.getVideoTracks()[0];
    const canvas = document.createElement('canvas');
    const video = document.createElement('video');

    video.srcObject = stream;
    video.play();

    canvas.width = track.getSettings().width!;
    canvas.height = track.getSettings().height!;

    // 100ms is not long enough
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // @ts-ignore
    canvas
      .getContext('2d')
      .drawImage(
        video,
        0,
        0,
        track.getSettings().width!,
        track.getSettings().height!,
        0,
        0,
        track.getSettings().width!,
        track.getSettings().height!
      );

    track.stop();

    return canvas;
  }

  // This method redlies on APIs that are not available in Firefox
  private async displayMediaScreenshotDeprecated(): Promise<HTMLCanvasElement> {
    // https://www.webrtc-experiment.com/getDisplayMedia/
    const getDisplayMediaConstraints = {
      video: {
        // frameRate: 5,
        // width: 1920,
        // height: 1080,
        // displaySurface: "window",
        // logicalSurface: true,
      },
      audio: false,
    };

    // @ts-ignore
    const stream = await navigator.mediaDevices.getDisplayMedia(getDisplayMediaConstraints);
    const track = stream.getVideoTracks()[0];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // @ts-ignore
    const imageCapture = new ImageCapture(track);

    const imageBitmap = await imageCapture.grabFrame();

    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    // @ts-ignore
    canvas
      .getContext('2d')
      .drawImage(
        imageBitmap,
        0,
        0,
        imageBitmap.width,
        imageBitmap.height,
        0,
        0,
        imageBitmap.width,
        imageBitmap.height
      );

    track.stop();

    return canvas;
  }

  private async getBlobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject('Bad blob');
          }
        },
        'image/jpeg',
        0.85
      );
    });
  }

  private async saveBlobAsImage(blob: Blob) {
    // https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = 'screenshot.jpeg';
    a.click();
    // window.URL.revokeObjectURL(url);
  }

  private getStaticScreenshotUploadData(authState: IAuthState) {
    return {
      license: authState.license,
      url: window.location.href,
      state: window.location.origin,
      metrcId: authState.identity,
    };
  }

  // private async sendImageToServerFromContentScript(blob: Blob, partialScreenshotUploadData: IBackgroundScriptScreenshotUploadData) {
  //     const screenshotUploadData: IContentScriptScreenshotUploadData = {
  //         blobUrl: window.URL.createObjectURL(blob),
  //         ...partialScreenshotUploadData,
  //     };

  //     const result = await messageBus.sendMessageToBackground(
  //         MessageType.UPLOAD_SCREENSHOT, screenshotUploadData);

  //     return result;
  // }

  private async sendImageToServerFromBackgroundScript(
    blob: Blob,
    partialScreenshotUploadData: IBackgroundScriptScreenshotUploadData
  ) {
    // const screenshotUploadData: IContentScriptScreenshotUploadData = {
    //     blobUrl: window.URL.createObjectURL(blob),
    //     ...partialScreenshotUploadData,
    // };
    // const response = await stubRequestManager.uploadScreenshot(screenshotUploadData)
    // return response;
  }
}

export const screenshotManager = new ScreenshotManager();
