import { ModalAction, ModalType } from "@/consts";
import { IAtomicService } from "@/interfaces";
import { Observable, Subject } from "rxjs";

export interface IModalEvent {
  modalType: ModalType;
  modalAction: ModalAction;
  modalEventOptions: any;
}

export interface IContextMenuEvent {
  x: number;
  y: number;
  packageTag?: string;
  zeroPaddedManifestNumber?: string;
  manifestNumber?: string;
}

export class ModalManager implements IAtomicService {
  private _modal: Subject<IModalEvent> = new Subject();

  private _hoverMenu: Subject<IContextMenuEvent | null> = new Subject();

  async init() {}

  modal$(): Observable<IModalEvent> {
    return this._modal.asObservable();
  }

  hoverMenu$(): Observable<IContextMenuEvent | null> {
    return this._hoverMenu.asObservable();
  }

  dispatchModalEvent(
    modalType: ModalType,
    modalAction = ModalAction.OPEN,
    modalEventOptions: any = null
  ) {
    // This could be problematic
    //
    // if (store.state.settings?.disablePopups) {
    //     return;
    // }

    this._modal.next({ modalType, modalAction, modalEventOptions });
  }

  dispatchContextMenuEvent(e: IContextMenuEvent | null) {
    this._hoverMenu.next(e);
  }
}

export const modalManager = new ModalManager();
