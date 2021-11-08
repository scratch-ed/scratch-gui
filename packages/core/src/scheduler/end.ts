import { ScheduledAction } from './action';
import { LogFrame } from '../log';
import { Deferred } from '../deferred';
import { Context } from '../context';

import type { ScheduledEvent } from './scheduled-event';

export class EndAction extends ScheduledAction {
  execute(context: Context, resolve: (v: string) => void): void {
    for (const event of context.log.events.list) {
      if (event.nextFrame == null) {
        event.nextFrame = new LogFrame(context, 'programEnd');
      }
    }
    context.vm!.stopAll();

    resolve(`finished ${this}`);
    context.simulationEnd.resolve('done with simulation');
  }
}

export class JoinAction extends ScheduledAction {
  promise: Promise<string>;

  constructor(events: ScheduledEvent[]) {
    super();
    const promises = events.map((e) => {
      const deferred: Deferred<string> = new Deferred();
      const oldExecute = e.action.execute;
      e.action.execute = (context: Context, resolve: (v: string) => void) => {
        oldExecute.call(e.action, context, (value: string) => {
          deferred.resolve(value);
          resolve(value);
        });
      };
      return deferred.promise;
    });
    this.promise = Promise.race(promises);
  }

  execute(_context: Context, resolve: (v: string) => void): void {
    // Do nothing.
    this.promise.then(
      () => {
        console.log('Threads have been joined...');
        resolve('has been joined');
      },
      (reason) => {
        throw reason;
      },
    );
  }
}
