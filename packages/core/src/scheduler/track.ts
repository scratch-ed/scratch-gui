import { ScheduledAction } from './action';
import { Context } from '../context';

import type Target from '@ftrprf/judge-scratch-vm-types/types/engine/target';
import { BroadcastReceiver, BroadcastUpdate } from '../listener';
import { LogEvent, LogFrame } from '../log';

export class TrackSpriteAction extends ScheduledAction {
  name: string;

  constructor(sprite: string) {
    super();
    this.name = sprite;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    const sprite = context.vm!.runtime.getSpriteTargetByName(this.name);
    if (!sprite) {
      throw new Error(`Sprite ${this.name} was not found in the runtime.`);
    }
    sprite.addListener('EVENT_TARGET_VISUAL_CHANGE', (target: Target) => {
      context.log.addFrame(context, `update_${target.getName()}`);
    });
    resolve('register complete');
  }
}

class BroadcastLogger implements BroadcastReceiver {
  private readonly context: Context;
  private readonly name: string;

  public constructor(context: Context, name: string) {
    this.context = context;
    this.name = name;
  }

  get active(): boolean {
    return true;
  }

  update(options: BroadcastUpdate): void {
    if (options?.matchFields?.BROADCAST_OPTION === this.name) {
      const event = new LogEvent(this.context, 'broadcast_sent', { name: this.name });
      event.previousFrame = new LogFrame(this.context, 'broadcast_sent');
      this.context.log.addEvent(event);
    }
  }
}

export class TrackBroadcasts extends ScheduledAction {
  names: string[];

  constructor(name: string[]) {
    super();
    this.names = name;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    for (const name of this.names) {
      context.broadcastListeners.push(new BroadcastLogger(context, name));
    }
    resolve('register complete');
  }
}
