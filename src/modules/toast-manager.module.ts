import { IAtomicService } from "@/interfaces";
import store from "@/store/page-overlay";
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
}

export const toastManager = new ToastManager();
