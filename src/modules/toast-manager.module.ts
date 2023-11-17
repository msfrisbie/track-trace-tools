import { IAtomicService } from '@/interfaces';
import store from '@/store/page-overlay';
import { Observable, Subject } from 'rxjs';

export interface ToastPayload {
    text: string
    options: any
}

export class ToastManager implements IAtomicService {
    private _toast: Subject<ToastPayload> = new Subject();

    async init() {
    }

    toast$(): Observable<ToastPayload> {
      return this._toast.asObservable();
    }

    openToast(text: string, options: any) {
      if (store.state.settings?.disablePopups) {
        return;
      }

      this._toast.next({ text, options });
    }

    error(text: string) {
      this.openToast(text, {
        title: 'Error!',
        autoHideDelay: 5000,
        variant: 'danger',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    }

    warn(text: string) {
      this.openToast(text, {
        title: 'Warning!',
        autoHideDelay: 5000,
        variant: 'warning',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    }

    info(text: string) {
      this.openToast(text, {
        title: 'T3',
        autoHideDelay: 5000,
        variant: 'info',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    }

    success(text: string) {
      this.openToast(text, {
        title: 'Success!',
        autoHideDelay: 5000,
        variant: 'primary',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    }
}

export const toastManager = new ToastManager();
