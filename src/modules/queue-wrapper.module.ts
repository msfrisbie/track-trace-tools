import { IAtomicService, Task } from '@/interfaces';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import { runTask } from '@/utils/tasks';
import { authManager } from './auth-manager.module';

// DEPRECATED
class DeprecatedQueueWrapper implements IAtomicService {
  private intervalId: number | null = null;

  inflightTask: Task | null = null;

  lastCompletedTask: Task | null = null;

  async init() {
    await authManager.authStateOrError();

    this.intervalId = setInterval(async () => {
      if (this.inflightTask) {
        return;
      }

      if (store.state.taskQueuePaused) {
        return;
      }

      if (store.state.taskQueue.length > 0) {
        const task = JSON.parse(JSON.stringify(store.state.taskQueue[0]));

        this.updateTask(task);

        let success = false;

        try {
          if (!this.inflightTask) {
            throw new Error('No task set');
          }

          success = await runTask(this.inflightTask);
        } catch (e) {
          console.log('Task failed', e);
        }

        if (success) {
          store.commit(MutationType.DEQUEUE_TASK, (this.inflightTask as any).taskId);
          this.lastCompletedTask = task;
        } else {
          // store.commit(MutationType.SET_FLASH_MESSAGE, 'Job failed to complete, queue paused.');
          store.commit(MutationType.TOGGLE_PAUSE_TASK_QUEUE);
        }

        if (store.state.taskQueue.length === 0) {
          // page is stale, refresh
          window.location.reload();
        }
      }

      this.updateTask(null);
    }, 250) as any;
  }

  purge() {
    store.commit(MutationType.PURGE_TASK_QUEUE);
  }

  togglePause() {
    store.commit(MutationType.TOGGLE_PAUSE_TASK_QUEUE);
  }

  updateTask(task: Task | null) {
    this.inflightTask = task;
  }

  teardown() {
    this.intervalId && clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

export const queueWrapper = new DeprecatedQueueWrapper();
