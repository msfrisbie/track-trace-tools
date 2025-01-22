import { IAtomicService } from "@/interfaces";

export interface IDeprecatedFlags {
  enableCsvBuilder: boolean;
  enableQuickActions: boolean;
  downloadDocumentOnOpen: boolean;
  eagerlyCacheTransferTemplate: boolean;
  disableTransferTools: boolean;
}

const DEFAULT_FLAGS: IDeprecatedFlags = {
  enableCsvBuilder: false,
  enableQuickActions: false,
  downloadDocumentOnOpen: false,
  eagerlyCacheTransferTemplate: true,
  disableTransferTools: true,
};

const FLAG_OVERRIDE_KEY = "mt-flagoverride";

class DeprecatedFlagManager implements IAtomicService {
  public flags: IDeprecatedFlags;

  constructor() {
    const existingFlagData: string = localStorage.getItem(FLAG_OVERRIDE_KEY) || "{}";

    const existingFlags: IDeprecatedFlags = JSON.parse(existingFlagData);

    this.flags = {
      ...DEFAULT_FLAGS,
      ...existingFlags,
    };
  }

  async init() {}

  resetFlags() {
    this.flags = DEFAULT_FLAGS;
    localStorage.removeItem(FLAG_OVERRIDE_KEY);
  }

  overrideFlags(flags: IDeprecatedFlags) {
    this.flags = flags;
    localStorage.setItem(FLAG_OVERRIDE_KEY, JSON.stringify(flags));
  }
}

export const flagManager = new DeprecatedFlagManager();
