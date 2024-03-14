import { IAtomicService } from "@/interfaces";
import { dynamicConstsManager } from "./dynamic-consts-manager.module";

// Class for testing code that runs at various lifecycle points
class SandboxManager implements IAtomicService {
  async init() {}

  async runsBeforeModuleInit() {}

  async runsBeforeVueAppMount() {}

  async runsAfterAuthInit() {}

  async runsAfterModuleInit() {
  }
}

export const sandboxManager = new SandboxManager();
