import {
  MessageType, PackageState, TagState, TransferState,
} from '@/consts';
import {
  IAtomicService,
  IIndexedPackageData,
  IIndexedPackageFilters,
  IIndexedTagData,
  IIndexedTagFilters,
  IIndexedTransferData,
  IIndexedTransferFilters,
  IPackageData,
  ITagData,
  ITransferData,
} from '@/interfaces';
import { authManager } from '@/modules/auth-manager.module';
import { messageBus } from '@/modules/message-bus.module';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import { dataObjectToIndexableTags } from '@/utils/db';
import { toastManager } from './toast-manager.module';

function setError(errorMessage: string | null) {
  if (errorMessage) {
    if (store.state.errorMessage === errorMessage) {
      return;
    }

    toastManager.openToast(errorMessage, {
      title: 'Error',
      autoHideDelay: 5000,
      variant: 'danger',
      appendToast: true,
      toaster: 'ttt-toaster',
      solid: true,
    });
  }
}

class DatabaseInterface implements IAtomicService {
  async init() {}

  async indexPackages(packagesData: IPackageData[], packageState: PackageState) {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const indexedPackagesData = packagesData.map((packageData) => {
      const tagMatcher = dataObjectToIndexableTags(packageData).join(' ');

      return {
        ...packageData,
        License: authState.license,
        PackageState: packageState,
        TagMatcher: tagMatcher,
      };
    });

    messageBus.sendMessageToBackground(MessageType.INDEX_PACKAGES, {
      indexedPackagesData,
    });
  }

  async indexTransfers(transfersData: ITransferData[], transferState: TransferState) {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const indexedTransfersData = transfersData.map((transferData) => {
      const tagMatcher = dataObjectToIndexableTags(transferData).join(' ');

      return {
        ...transferData,
        License: authState.license,
        TransferState: transferState,
        TagMatcher: tagMatcher,
      };
    });

    messageBus.sendMessageToBackground(MessageType.INDEX_TRANSFERS, {
      indexedTransfersData,
    });
  }

  async indexTags(tagData: ITagData[], tagState: TagState) {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const indexedTagsData = tagData.map((tagData) => {
      const tagMatcher = dataObjectToIndexableTags(tagData).join(' ');

      return {
        ...tagData,
        License: authState.license,
        TagState: tagState,
        TagMatcher: tagMatcher,
      };
    });

    messageBus.sendMessageToBackground(MessageType.INDEX_TAGS, {
      indexedTagsData,
    });
  }

  async packageSearch(
    queryString: string,
    filters: IIndexedPackageFilters,
  ): Promise<IIndexedPackageData[]> {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const formattedQuery = queryString.toUpperCase();

    const response = await messageBus.sendMessageToBackground(MessageType.SEARCH_PACKAGES, {
      query: formattedQuery,
      license: authState.license,
      filters,
    });

    if (!response || !response.data) {
      setError('Package search failed. Try refreshing the page.');

      throw new Error('Package search failed');
    } else {
      setError(null);
    }

    return response.data.packages;
  }

  async transferSearch(
    queryString: string,
    filters: IIndexedTransferFilters,
  ): Promise<IIndexedTransferData[]> {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const formattedQuery = queryString.toUpperCase();

    const response = await messageBus.sendMessageToBackground(MessageType.SEARCH_TRANSFERS, {
      query: formattedQuery,
      license: authState.license,
      filters,
    });

    if (!response || !response.data) {
      setError('Transfer search failed. Try refreshing the page.');

      throw new Error('Transfer search failed');
    } else {
      setError(null);
    }

    return response.data.transfers;
  }

  async tagSearch(queryString: string, filters: IIndexedTagFilters): Promise<IIndexedTagData[]> {
    const authState = await authManager.authStateOrError('User is not authenticated');

    const formattedQuery = queryString.toUpperCase();

    const response = await messageBus.sendMessageToBackground(MessageType.SEARCH_TAGS, {
      query: formattedQuery,
      license: authState.license,
      filters,
    });

    if (!response || !response.data) {
      setError('Tag search failed. Try refreshing the page.');

      throw new Error('Tag search failed');
    } else {
      setError(null);
    }

    return response.data.tags;
  }
}

export const databaseInterface = new DatabaseInterface();
