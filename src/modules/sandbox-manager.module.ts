import { IAtomicService } from '@/interfaces';

// Class for testing code that runs at various lifecycle points
class SandboxManager implements IAtomicService {
  async init() {}

  async runsBeforeModuleInit() {}

  async runsBeforeVueAppMount() {
  }

  async runsAfterAuthInit() {}
}

export const sandboxManager = new SandboxManager();
