/* eslint-disable */
import castArray from 'lodash-es/castArray';
import { ScheduledAction } from './action';
import { LogEvent, LogFrame } from '../log';
import { BroadcastListener } from '../listener';
import { castCallback, numericEquals } from '../utils';
import { Context } from '../context';
import { WaitCondition } from './scheduled-event';
import { Position } from '../lines';

import type RenderedTarget from '@ftrprf/judge-scratch-vm-types/types/sprites/rendered-target';

class WaitEvent extends ScheduledAction {
  delay: number;

  constructor(delay: number) {
    super();
    this.delay = delay;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    const delay = context.accelerateEvent(this.delay);
    setTimeout(() => {
      resolve(`finished ${this}`);
    }, delay);
  }

  toString(): string {
    return `${super.toString()} for ${this.delay}`;
  }
}

class WaitForSpriteAction extends ScheduledAction {
  name: string;
  active: boolean;

  constructor(name: string) {
    super();
    this.name = name;
    this.active = true;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    const sprite = context.vm!.runtime.getSpriteTargetByName(this.name) as RenderedTarget;
    if (!sprite) {
      throw new Error(`Sprite ${this.name} was not found in the runtime.`);
    }
    const callback = (target: RenderedTarget, oldX: number, oldY: number) => {
      if (target.x !== oldX || target.y !== oldY) {
        sprite.removeListener('TARGET_MOVED', callback);
        resolve(`finished ${this}`);
      }
    };
    sprite.addListener('TARGET_MOVED', callback);
  }

  toString() {
    return `Wait for sprite ${this.name} to move.`;
  }
}

class WaitForSpritePositionAction extends ScheduledAction {
  callback: (x: number, y: number) => boolean;
  name: string;

  constructor(name: string, callback: (x: number, y: number) => boolean) {
    super();
    this.name = name;
    this.callback = callback;
  }

  execute(context: Context, resolve: (s: string) => void) {
    const sprite = context.vm!.runtime.getSpriteTargetByName(this.name);
    if (!sprite) {
      throw new Error(`Sprite ${this.name} was not found in the runtime.`);
    }
    const event = new LogEvent(context, 'waitForSpritePosition');
    event.previousFrame = new LogFrame(context, 'event');
    context.log.addEvent(event);
    const callback = (target: RenderedTarget) => {
      if (this.callback(target.x, target.y)) {
        sprite.removeListener('TARGET_MOVED', callback);
        event.nextFrame = new LogFrame(context, 'event');
        resolve(`finished ${this}`);
      }
    };
    sprite.addListener('TARGET_MOVED', callback);
  }

  toString() {
    return `Wait for sprite ${this.name} to reach one of ${this.callback}`;
  }
}

class WaitForSpriteTouchAction extends ScheduledAction {
  paramCallback: () => string[];
  name: string;
  targets?: string[];

  constructor(name: string, paramCallback: () => string[]) {
    super();
    this.name = name;
    this.paramCallback = paramCallback;
  }

  execute(context: Context, resolve: (v: string) => void) {
    const sprite = context.vm!.runtime.getSpriteTargetByName(this.name);
    if (!sprite) {
      throw new Error(`Sprite ${this.name} was not found in the runtime.`);
    }
    this.targets = castArray(this.paramCallback());
    const event = new LogEvent(context, 'waitForSpriteTouch', {
      targets: this.targets,
      sprite: this.name,
    });
    event.previousFrame = new LogFrame(context, 'event');
    context.log.addEvent(event);
    const callback = (target: RenderedTarget) => {
      for (const goal of this.targets!) {
        console.log('Checking...', goal);
        if (target.isTouchingObject(goal)) {
          sprite.removeListener('TARGET_MOVED', callback);
          event.nextFrame = new LogFrame(context, 'event');
          resolve(`finished ${this}`);
          return;
        }
      }
    };
    sprite.addListener('TARGET_MOVED', callback);
  }

  toString() {
    return `Wait for sprite ${this.name} to touch one of ${this.targets}`;
  }
}

class WaitForSpriteNotTouchAction extends ScheduledAction {
  name: string;
  paramCallback: () => string;
  target?: string;

  constructor(name: string, paramCallback: () => string) {
    super();
    this.name = name;
    this.paramCallback = paramCallback;
  }

  execute(context: Context, resolve: (v: string) => void) {
    const sprite = context.vm!.runtime.getSpriteTargetByName(this.name);
    if (!sprite) {
      throw new Error(`Sprite ${this.name} was not found in the runtime.`);
    }
    this.target = this.paramCallback();
    const event = new LogEvent(context, 'waitForSpriteNotTouch', {
      target: this.target,
      sprite: this.name,
    });
    event.previousFrame = new LogFrame(context, 'event');
    context.log.addEvent(event);
    const callback = (target: RenderedTarget) => {
      if (!target.isTouchingObject(this.target!)) {
        sprite.removeListener('TARGET_MOVED', callback);
        event.nextFrame = new LogFrame(context, 'event');
        resolve(`finished ${this}`);
      }
    };
    sprite.addListener('TARGET_MOVED', callback);
  }

  toString() {
    return `Wait for sprite ${this.name} to not touch ${
      this.target || this.paramCallback
    }`;
  }
}

class WaitOnBroadcastAction extends ScheduledAction {
  name: string;
  constructor(name: string) {
    super();
    this.name = name;
  }

  execute(context: Context, resolve: (v: string) => void) {
    const event = new LogEvent(context, 'broadcast_listener', {
      name: this.name,
    });
    event.previousFrame = new LogFrame(context, 'broadcast_listener');
    context.log.addEvent(event);

    const listener = new BroadcastListener(this.name);
    context.broadcastListeners.push(listener);
    listener.promise.then(() => {
      event.nextFrame = new LogFrame(context, 'broadcastReceived');
      resolve(`finished ${this}`);
    });
  }

  toString(): string {
    return super.toString() + ' ' + this.name;
  }
}

/**
 * Various conditions for sprites.
 */
export class SpriteCondition {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Wait for a sprite to move.
   *
   * @param timeout - Optional timeout.
   */
  toMove(timeout?: number): WaitCondition {
    return {
      action: new WaitForSpriteAction(this.name),
      timeout: timeout,
    };
  }

  /**
   * Wait for a sprite to reach a certain position.
   *
   * You can pass one position or a list of positions. If a list, the sprite
   * needs to reach one of the locations. For each location, you can leave either x or y
   * as null, which will be interpreted as a wildcard. A position object with both x and y
   * as null is considered an error.
   *
   * Alternatively, you can pass a callback that will receive the position (x,y) of the sprite.
   * It must return true if the position is considered reached.
   *
   * The callback can be used to test things like "is the sprite.x > 170?".
   *
   * This event is logged with event type `waitForSpritePosition`. The previous frame
   * is taken at the start of the wait. The next frame is taken when the condition has been
   * completed.
   *
   * @param positions - The positions.
   * @param timeout - Optional timeout.
   */
  toReach(
    positions:
      | ((x: number, y: number) => boolean)
      | Partial<Position>[]
      | Partial<Position>,
    timeout?: number,
  ): WaitCondition {
    let callback;
    if (typeof positions !== 'function') {
      callback = (x: number, y: number) => {
        return castArray(positions).some((pos) => {
          if (pos.x === null && pos.y === null) {
            console.warn('Both positions in wait condition are wildcard. A mistake?');
          }
          return (
            (pos.x === null || pos.x === undefined || numericEquals(x, pos.x)) &&
            (pos.y === null || pos.y === undefined || numericEquals(y, pos.y))
          );
        });
      };
    } else {
      callback = positions;
    }
    return {
      action: new WaitForSpritePositionAction(this.name, callback),
      timeout: timeout,
    };
  }

  /**
   * Wait for a sprite to touch another sprite.
   *
   * This event is logged with event type `waitForSpriteTouch`. The previous frame
   * is taken at the start of the wait. The next frame is taken when the condition has been
   * completed.
   *
   * @param targets - Name of the sprite.
   * @param timeout - Optional timeout.
   *
   * @return {WaitCondition}
   */
  toTouch(
    targets: string | string[] | (() => string | string[]),
    timeout?: number,
  ): WaitCondition {
    const callback = castCallback(targets);
    return {
      action: new WaitForSpriteTouchAction(this.name, callback),
      timeout: timeout,
    };
  }

  /**
   * Wait for a sprite to not touch another sprite.
   */
  toNotTouch(target: string | (() => string), timeout?: number): WaitCondition {
    const callback = castCallback(target);
    return {
      action: new WaitForSpriteNotTouchAction(this.name, callback),
      timeout: timeout,
    };
  }

  /**
   * Wait for a sprite to touch the edge of the stage.
   *
   * @param timeout - Optional timeout.
   */
  toTouchEdge(timeout?: number): WaitCondition {
    return this.toTouch('_edge_', timeout);
  }

  /**
   * Wait for a sprite to touch the current mouse position.
   *
   * If you want to move the mouse while waiting on it, you should
   * fork the event stream.
   *
   * @param timeout - Optional timeout.
   */
  toTouchMouse(timeout?: number): WaitCondition {
    return this.toTouch('_mouse_', timeout);
  }
}

/**
 * Start a condition for a specific sprite.
 *
 * @param name - Name of the sprite.
 */
export function sprite(name: string): SpriteCondition {
  return new SpriteCondition(name);
}

/**
 * Wait for a broadcast to be sent before proceeding.
 *
 * As with all wait events, this event is always synchronous.
 *
 * The event is logged with event type `broadcast_listener`.
 *
 * @param name - Name of the broadcast to wait on.
 * @param timeout - Max time to wait before aborting.
 */
export function broadcast(name: string, timeout?: number): WaitCondition {
  return {
    action: new WaitOnBroadcastAction(name),
    timeout: timeout,
  };
}

/**
 * Wait delay amount of ms before proceeding with the next event.
 * This event is always synchronous.
 *
 * @param delay - How long we should wait in ms.
 */
export function delay(delay: number): WaitCondition {
  return {
    action: new WaitEvent(delay),
    timeout: delay + 100,
  };
}
