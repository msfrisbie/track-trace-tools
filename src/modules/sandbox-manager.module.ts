import { IAtomicService } from "@/interfaces";

// Class for testing code that runs at various lifecycle points
class SandboxManager implements IAtomicService {
  async init() {}

  async runsBeforeModuleInit() {}

  async runsOnPageload() {}

  async runsAfterAuthInit() {}
}

export let sandboxManager = new SandboxManager();
