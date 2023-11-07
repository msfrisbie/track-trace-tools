import { IAtomicService } from '@/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

class TabManager implements IAtomicService {
    private _isVisible: BehaviorSubject<any> = new BehaviorSubject(true);

    async init() {
      window.addEventListener('focus', () => this._isVisible.next(true));
      window.addEventListener('blur', () => this._isVisible.next(false));
    }

    isVisible$(): Observable<boolean> {
      return this._isVisible.asObservable().pipe(
        distinctUntilChanged(),
      );
    }
}

export const tabManager = new TabManager();
