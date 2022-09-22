
import { MessageType } from '@/consts';
import { messageBus } from '@/modules/message-bus.module';
import { clear, del, get, keys, set } from 'idb-keyval';
import { AsyncStorage } from 'vuex-persist';

// UNTESTED CODE
// UNTESTED CODE
// UNTESTED CODE
// UNTESTED CODE
// UNTESTED CODE
// UNTESTED CODE
// UNTESTED CODE

// Frontend
export const CustomAsyncStorageWrapper: AsyncStorage = {
    async length(): Promise<number> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, {});

        return response.data;
    },
    async key(index: number): Promise<string> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, { index });

        return response.data;
    },
    async clear(): Promise<void> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, {});

        return response.data;
    },
    async getItem<T>(key: string): Promise<T> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, { key });

        return response.data;
    },
    async setItem<T>(key: string, data: T): Promise<T> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, { key, data });

        return response.data;
    },
    async removeItem(key: string): Promise<void> {
        const response = await messageBus.sendMessageToBackground(MessageType.ASYNC_STORAGE_LENGTH, { key });

        return response.data;
    }
}

// Backend
export const CustomAsyncStorage: AsyncStorage = {
    async length(): Promise<number> {
        return (await keys()).length;
    },
    async key(index: number): Promise<string> {
        return (await keys())[index].toString();
    },
    async clear(): Promise<void> {
        return clear();
    },
    async getItem<T>(key: string): Promise<T> {
        // @ts-ignore
        return get(key);
    },
    async setItem<T>(key: string, data: T): Promise<T> {
        await set(key, data);
        return data;
    },
    async removeItem(key: string): Promise<void> {
        return del(key);
    }
}