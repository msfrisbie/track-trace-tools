import { mockDebugUtils } from "@/test/utils/mocks";
import { enableFetchMocks } from 'jest-fetch-mock';

mockDebugUtils();

enableFetchMocks();

describe("auth-manager.module.ts", () => {
    it('works', () => { });
});