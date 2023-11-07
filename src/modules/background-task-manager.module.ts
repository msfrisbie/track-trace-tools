import { BackgroundTaskState, MessageType } from '@/consts';
import { IAtomicService, ISalesReceiptData, ITagData } from '@/interfaces';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import { getIsoDateStringFromIsoDatetime } from '@/utils/date';
import { getTagFromOffset, getVoidTagBody } from '@/utils/tags';
import { timer } from 'rxjs';
import { analyticsManager } from './analytics-manager.module';
import { authManager } from './auth-manager.module';
import { primaryDataLoader } from './data-loader/data-loader.module';
import { primaryMetrcRequestManager } from './metrc-request-manager.module';

class BackgroundTaskManager implements IAtomicService {
  async init() {
    await authManager.authStateOrError();

    if (store.state.backgroundTasks.finalizeSalesReceiptsState === BackgroundTaskState.RUNNING) {
      this.finalizeSalesImpl();
    }

    if (store.state.backgroundTasks.voidTagsState === BackgroundTaskState.RUNNING) {
      this.voidTagsImpl();
    }
  }

  async startFinalize() {
    const authState = await authManager.authStateOrError();

    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_STATE, BackgroundTaskState.RUNNING);
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_LICENSE, authState.license);
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_READOUT, null);
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_RUNNING_TOTAL, 0);

    analyticsManager.track(MessageType.STARTED_FINALIZE_BACKGROUND_JOB);

    this.finalizeSalesImpl();
  }

  stopFinalize(ranToCompletion: boolean = false) {
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_STATE, BackgroundTaskState.SUCCESS);
    this.setFinalizeReadout(
      `Finalized ${store.state.backgroundTasks.finalizeSalesReceiptsRunningTotal} receipts.`
    );

    if (ranToCompletion) {
      analyticsManager.track(MessageType.FINALIZED_SALES_SUCCESS);
    } else {
      analyticsManager.track(MessageType.STOPPED_FINALIZE_BACKGROUND_JOB);
    }
  }

  finalizeError(error: string) {
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_STATE, BackgroundTaskState.ERROR);
    this.setFinalizeReadout(error);

    analyticsManager.track(MessageType.FINALIZED_SALES_ERROR, { error });
  }

  setFinalizeReadout(readout: string) {
    store.commit(MutationType.SET_FINALIZE_SALES_RECEIPTS_READOUT, readout);
  }

  private async finalizeSalesImpl() {
    const authState = await authManager.authStateOrError();

    if (store.state.backgroundTasks.finalizeSalesReceiptsLicense !== authState.license) {
      this.finalizeError('The job stopped because you changed licenses.');
    }

    if (store.state.backgroundTasks.finalizeSalesReceiptsState !== BackgroundTaskState.RUNNING) {
      this.stopFinalize();
      return;
    }

    this.setFinalizeReadout('Loading sales receipts...');

    let receipts: ISalesReceiptData[] = [];

    for (let i = 0; ; ++i) {
      try {
        receipts = await primaryDataLoader.activeSalesReceipts();

        break;
      } catch (e) {
        console.error(i);
        console.error(e);
        if (i > 20) {
          this.finalizeError(
            'Metrc returned an error when trying to load sales receipts. Try again.'
          );
          return;
        }

        await timer(3000).toPromise();
      }
    }

    if (store.state.backgroundTasks.finalizeSalesReceiptsState !== BackgroundTaskState.RUNNING) {
      this.stopFinalize();
      return;
    }

    const isodate = store.state.backgroundTasks?.finalizeSalesReceiptsStopIsodate;

    if (isodate) {
      receipts = receipts.filter(
        (receipt) => getIsoDateStringFromIsoDatetime(receipt.RecordedDateTime) < isodate
      );
    }

    receipts = receipts.slice(0, 100);

    if (receipts.length === 0) {
      this.stopFinalize(true);
      return;
    }

    this.setFinalizeReadout(`Finalizing ${receipts.length} sales receipts...`);

    for (let i = 0; ; ++i) {
      try {
        const receiptPayload = receipts.map((x) => ({ Id: x.Id.toString() }));

        const response = await primaryMetrcRequestManager.finalizeSalesReceipts(
          JSON.stringify(receiptPayload)
        );

        if (response.status !== 200) {
          throw new Error('Failed to finalize sales receipts');
        }

        break;
      } catch (e) {
        console.error(i);
        console.error(e);
        if (i > 20) {
          this.finalizeError(
            'Metrc returned an error when trying to finalize sales receipts. Try again.'
          );
          return;
        }

        await timer(3000).toPromise();
      }
    }

    analyticsManager.track(MessageType.FINALIZED_SALES_RECEIPTS, {
      count: receipts.length
    });

    if (store.state.backgroundTasks.finalizeSalesReceiptsState !== BackgroundTaskState.RUNNING) {
      this.stopFinalize();
      return;
    }

    this.setFinalizeReadout(
      `Finalized ${store.state.backgroundTasks.finalizeSalesReceiptsRunningTotal} receipts.`
    );

    store.commit(
      MutationType.SET_FINALIZE_SALES_RECEIPTS_RUNNING_TOTAL,
      store.state.backgroundTasks.finalizeSalesReceiptsRunningTotal + receipts.length
    );

    if (store.state.backgroundTasks.finalizeSalesReceiptsState === BackgroundTaskState.RUNNING) {
      this.finalizeSalesImpl();
    }
  }

  async startVoid(startTag: string, endTag: string) {
    const authState = await authManager.authStateOrError();

    store.commit(MutationType.SET_VOID_TAGS_DATA, {
      startTag,
      endTag,
      lastAttemptedTag: null
    });
    store.commit(MutationType.SET_VOID_TAGS_STATE, BackgroundTaskState.RUNNING);
    store.commit(MutationType.SET_VOID_TAGS_LICENSE, authState.license);
    store.commit(MutationType.SET_VOID_TAGS_READOUT, null);
    store.commit(MutationType.SET_VOID_TAGS_RUNNING_TOTAL, 0);
    store.commit(MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL, 0);

    analyticsManager.track(MessageType.STARTED_VOID_TAGS_BACKGROUND_JOB);

    this.voidTagsImpl();
  }

  stopVoid(ranToCompletion: boolean = false) {
    store.commit(
      MutationType.SET_VOID_TAGS_READOUT,
      `Voided ${store.state.backgroundTasks.voidTagsRunningTotal} tags.`
    );

    store.commit(MutationType.SET_VOID_TAGS_DATA, {
      startTag: null,
      endTag: null,
      lastAttemptedTag: null
    });
    store.commit(MutationType.SET_VOID_TAGS_STATE, BackgroundTaskState.SUCCESS);
    store.commit(MutationType.SET_VOID_TAGS_LICENSE, null);
    store.commit(MutationType.SET_VOID_TAGS_RUNNING_TOTAL, 0);
    store.commit(MutationType.SET_VOID_TAGS_CONSECUTIVE_ERROR_TOTAL, 0);

    if (ranToCompletion) {
      analyticsManager.track(MessageType.VOID_TAGS_SUCCESS);
    } else {
      analyticsManager.track(MessageType.STOPPED_VOID_TAGS_BACKGROUND_JOB);
    }
  }

  voidError(error: string) {
    store.commit(MutationType.SET_VOID_TAGS_STATE, BackgroundTaskState.ERROR);
    store.commit(MutationType.SET_VOID_TAGS_READOUT, error);

    analyticsManager.track(MessageType.VOID_TAGS_ERROR, { error });
  }

  private async voidTagsImpl() {
    const authState = await authManager.authStateOrError();

    if (store.state.backgroundTasks.voidTagsLicense !== authState.license) {
      this.voidError('The job stopped because you changed licenses.');
    }

    if (store.state.backgroundTasks.voidTagsState !== BackgroundTaskState.RUNNING) {
      this.stopVoid();
      return;
    }

    let currentTag: string | null = store.state.backgroundTasks.voidTagsStartTag;

    if (store.state.backgroundTasks.voidTagsLastAttemptedTag) {
      currentTag = getTagFromOffset(store.state.backgroundTasks.voidTagsLastAttemptedTag, 1);
    }

    if (!currentTag) {
      this.voidError('Failed to generate tag');
      return;
    }

    store.commit(MutationType.SET_VOID_TAGS_READOUT, `Loading tag ${currentTag}...`);

    let tagData: ITagData | null = null;

    for (let i = 0; ; ++i) {
      try {
        tagData = await primaryDataLoader.availableTag(currentTag);

        break;
      } catch (e) {
        console.error(i);
        console.error(e);
        if (i > 20) {
          this.voidError(
            `Metrc returned an error when looking up tag ${currentTag}. Check if this tag can be voided and try again.`
          );
          return;
        }

        await timer(3000).toPromise();
      }
    }

    if (store.state.backgroundTasks.voidTagsState !== BackgroundTaskState.RUNNING) {
      this.stopVoid();
      return;
    }

    store.commit(MutationType.SET_VOID_TAGS_READOUT, `Voiding tag ${currentTag}...`);

    store.commit(MutationType.SET_VOID_TAGS_DATA, {
      startTag: store.state.backgroundTasks.voidTagsStartTag,
      endTag: store.state.backgroundTasks.voidTagsEndTag,
      lastAttemptedTag: currentTag
    });

    for (let i = 0; ; ++i) {
      try {
        const response = await primaryMetrcRequestManager.voidTag(getVoidTagBody(tagData.Id));

        if (response.status !== 200) {
          throw new Error('Failed to void tag');
        }

        break;
      } catch (e) {
        console.error(i);
        console.error(e);
        if (i > 20) {
          this.voidError(
            `Metrc returned an error when trying to void tag ${currentTag}. Check if this tag can be voided and try again.`
          );
          return;
        }

        await timer(3000).toPromise();
      }
    }

    analyticsManager.track(MessageType.VOIDED_TAGS, { count: 1 });

    if (store.state.backgroundTasks.voidTagsState !== BackgroundTaskState.RUNNING) {
      this.stopVoid();
      return;
    }

    store.commit(
      MutationType.SET_VOID_TAGS_RUNNING_TOTAL,
      store.state.backgroundTasks.voidTagsRunningTotal + 1
    );

    store.commit(
      MutationType.SET_VOID_TAGS_READOUT,
      `Voided ${store.state.backgroundTasks.voidTagsRunningTotal} tags.`
    );

    if (currentTag === store.state.backgroundTasks.voidTagsEndTag) {
      this.stopVoid(true);
      return;
    }

    if (store.state.backgroundTasks.voidTagsState === BackgroundTaskState.RUNNING) {
      this.voidTagsImpl();
    }
  }
}

export const backgroundTaskManager = new BackgroundTaskManager();
