import { GreenFlagAction } from './green-flag';
import { CallbackAction } from './callback';
import { ClickSpriteAction } from './click';
import { KeyUseAction, MouseData, MouseUseAction, WhenPressKeyAction } from './io';
import { SendBroadcastAction } from './broadcast';
import { EndAction, JoinAction } from './end';
import { delay } from './wait';
import { TrackBroadcasts, TrackSpriteAction } from './track';
import { castCallback, MessageData } from '../utils';
import { FatalErrorException } from '../testplan';
import { ScheduledAction } from './action';
import { Context } from '../context';
import { SetVariableAction } from './variable';

import type Target from '@ftrprf/judge-scratch-vm-types/types/engine/target';

class InitialAction extends CallbackAction {
  constructor() {
    super(() => {});
  }
}

/**
 * Used to indicate an event timed out.
 */
class TimeoutError extends Error {}

export interface WaitCondition {
  action: ScheduledAction;
  timeout?: number;
}

/**
 * The Scratch scheduler: allows scheduling events that
 * will be executed when running a scratch project.
 *
 * While we mostly speak about "the scheduler", it doesn't really exist.
 * The scheduler is a chain or tree of events, starting with the first event.
 * Each event is responsible for their own scheduling, and then running next
 * events, as described below.
 *
 * ### Scheduling
 *
 * Event scheduling results in a tree of events. Each events a list of
 * next events to be executed when the current event is done (see below).
 *
 * All events on the same level, i.e. in the same list of next events, will
 * be launched at the same time.
 *
 * All functions return the last added event to anchor new events. If you don't
 * want this, you'll need to save the previous event manually.
 *
 * See the examples for details.
 *
 * ### Timeouts & other times
 *
 * Timeouts and other time params will be rescaled according to the global
 * acceleration factor. You should not apply it yourself. For example, if
 * you have an acceleration factor of 2, you should pass 10s to wait 5s.
 *
 * You can manually change this by using the option `timeAcceleration`. If
 * present, this will be used for all time-related acceleration. This allows
 * you to set the timeouts slower or faster than the frame acceleration, since
 * the frame acceleration is not always reached.
 *
 * ### Types of events
 *
 * There are two types of events:
 *
 * - sync events, which will block next events until they are completed
 * - async events, which will yield to next events before completion
 *
 * For example, a "wait" event will be sync, since it is otherwise
 * pretty useless.
 *
 * A click event might be sync or async. If you want to wait until
 * everything triggered by the click is done, you should make it sync.
 * However, suppose you want to click a sprite, which will then move around
 * forever; if so, this will cause a timeout. You must make it async.
 *
 * ### Example
 *
 * Assume we start with event A, which has two events as next: B1 and B2.
 * B1 is synchronous, while B2 is not. B1 takes 2 time units to complete.
 * Additionally, B1 has one next event, C1. B2 has two, C2 & C3.
 *
 * Below is a reconstructed timeline, where the number represents the time
 * unit at which an event is started.
 *
 * ```
 * 1. A
 * 2. B1 - B2
 * 3.      C2 - C3
 * 4.
 * 5. C1
 * ```
 *
 * @example <caption>Schedule events sequentially</caption>
 * event.newEvent()
 *      .newEvent()
 *      .newEvent()
 *
 * @example <caption>Schedule events in parallel</caption>
 * event.newEvent();
 * event.newEvent();
 * event.newEvent();
 */
export class ScheduledEvent {
  action: ScheduledAction;
  private readonly sync: boolean;
  private readonly timeout?: number;
  private nextEvents: ScheduledEvent[];
  private onResolve?: (c: Context) => void;
  private onTimeout?: (c: Context) => boolean | null;

  /**
   * Create a new event.
   *
   * You should not create events directly, but use one of the helper functions
   * instead.
   *
   * @param action - The action to execute on this event.
   * @param sync - The data for the event.
   * @param timeout - How to long to wait before resolving.
   */
  constructor(action: ScheduledAction, sync = true, timeout?: number) {
    this.action = action;
    this.sync = sync;
    this.timeout = timeout;
    this.nextEvents = [];
  }

  /**
   * Create the initial event.
   */
  static create(): ScheduledEvent {
    return new ScheduledEvent(new InitialAction());
  }

  /**
   * @return {string} A name identifying this event, for debugging and logging
   *                  purposes.
   */
  toString(): string {
    return this.action.toString();
  }

  /**
   * Execute this event, and launch the next events when allowed.
   *
   * If the current event is synchronous, the action is executed, after which
   * the next events are launched. If the event is asynchronous, the action is
   * executed, but the next events are launched immediately.
   *
   * You should not call this function; the framework takes care of it for you.
   */
  run(context: Context): Promise<void> {
    console.debug(`${context.timestamp()}: Running actions ${this.action.toString()}`);
    const action = new Promise((resolve, _reject) => {
      console.debug(
        `${context.timestamp()}: Executing actions ${this.action.toString()}`,
      );
      this.action.execute(context, resolve);
    });
    const timeout = new Promise((resolve, reject) => {
      const time = this.sync
        ? context.accelerateEvent(this.timeout || context.actionTimeout)
        : 0;
      setTimeout(() => {
        if (this.sync) {
          reject(
            new TimeoutError(
              `${context.timestamp()}: timeout after ${
                this.timeout || context.actionTimeout
              } (real: ${time}) from ${this.action.toString()}`,
            ),
          );
        } else {
          resolve(
            `${context.timestamp()}: Ignoring timeout for async event ${this.action.toString()}.`,
          );
        }
      }, time);
    });

    // This will take the result from the first promise to resolve, which
    // will be either the result or the timeout if something went wrong.
    // Note that async events cannot timeout.
    return Promise.race([action, timeout]).then(
      (v) => {
        console.debug(
          `${context.timestamp()}: resolved action ${this.action.toString()}: ${v}`,
        );

        if (this.onResolve) {
          this.onResolve(context);
        }

        // Schedule the next event. This will work for both sync & async events:
        // - For sync events this callback is reached either if the event resolves.
        //   If it times out, we don't schedule next events.
        // - For async events, the resolve of the timeout promise resolves immediately,
        //   we reach this immediately.
        this.nextEvents.forEach((e) => e.run(context));
      },
      (reason) => {
        console.debug(
          `${context.timestamp()}: Rejected actions ${this.action.toString()}`,
        );
        if (reason instanceof TimeoutError) {
          let escalate = true;
          if (this.onTimeout) {
            const result = this.onTimeout(context);
            escalate = typeof result === 'undefined' || !result;
          }

          // If there was no callback, or the callback requested we handle the error
          // escalate the status and stop the judgement.
          if (escalate) {
            console.warn(reason);
            context.output.escalateStatus({
              human: 'Tijdslimiet overschreden',
              enum: 'time limit exceeded',
            });
            context.output.closeJudgement(false);
          }
        } else if (reason instanceof FatalErrorException) {
          console.warn('Fatal test failed, stopping execution of all tests.');
          context.output.closeJudgement(false);
        } else {
          console.error('Unexpected error:', reason);
          context.output.escalateStatus({
            human: 'Fout bij uitvoeren testplan.',
            enum: 'runtime error',
          });
          context.output.appendMessage(reason);
          context.output.closeJudgement(false);
        }

        // Finish executing, ensuring we stop.
        context.terminate();
      },
    );
  }

  /**
   * Create and schedule a new event.
   *
   * @param action - What to execute.
   * @param sync - If the event is sync.
   * @param timeout - Optional timeout.
   */
  private constructNext(
    action: ScheduledAction,
    sync = true,
    timeout?: number,
  ): ScheduledEvent {
    const event = new (<typeof ScheduledEvent>this.constructor)(action, sync, timeout);
    this.nextEvents.push(event);
    return event;
  }

  /**
   * Wait for a certain condition before proceeding with the events.
   *
   * The basic most basic way to use this is to pass a number as argument.
   * In that case you will wait a number of ms before proceeding.
   *
   * The second option is to pass a `WaitCondition`. You can obtain one of those
   * using the following global functions:
   *
   * - {@link sprite}
   * - {@link delay} (passing a number to this function is equivalent to using this)
   * - {@link broadcast}
   *
   * Wait events are always synchronous. If you want to do something while waiting,
   * you need to fork the event scheduling.
   *
   * @param param - How long we should wait in ms.
   */
  wait(param: number | WaitCondition): ScheduledEvent {
    if (typeof param === 'number') {
      param = delay(param);
    }
    const { action, timeout } = param;
    return this.constructNext(action, true, timeout);
  }

  /**
   * Schedule an event for each item in a list.
   *
   * This function is basically a wrapper around `reduce`. For each item in the list,
   * the reducer is called with the result of the previous call and the current value,
   * and should return the new value for the next call.
   *
   * What this means is that the reducer should return the new anchor event. If you
   * return a new event each time, the events will be scheduled in sequence. If you
   * return the same event every time, they will be scheduled in parallel.
   *
   * The reducer accepts all params from the normal `reduce`'s reducer.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
   *
   * It basically means you get the accumulator, the value, (optionally) the value's index and (optionally)
   * the full array of items.
   *
   * @example <caption>Scheduling in sequence</caption>
   * event.forEach([100, 200, 300], (previous, value) => {
   *   return previous.wait(value);
   * })
   * // Schedules events that wait the amount in the array.
   *
   * @example <caption>Scheduling in parallel</caption>
   * event.forEach([100, 200, 300], (_previous, value) => {
   *   return event.wait(value);
   * })
   * // Schedules events that wait the amount in the array.
   *
   * By default, the last event will become the new anchor.
   *
   * @param items - The items to create events for.
   * @param reducer - Reduces the events.
   */
  forEach<T>(
    items: T[],
    reducer: (ev: ScheduledEvent, it: T, index: number, all: T[]) => ScheduledEvent,
  ): ScheduledEvent {
    return items.reduce(reducer, this);
  }

  /**
   * End the events and shut down the Scratch VM. After you are done
   * with your events, you should call this, or the VM risks to never
   * stop.
   *
   * Do ensure you either wait long enough, or anchor on a sync event,
   * or the VM will be stopped before all events have completed.
   *
   * This is a sync event: the event will resolve after the VM has
   * shut down.
   */
  end(): ScheduledEvent {
    return this.constructNext(new EndAction());
  }

  /**
   * Save the current frame in the log, optionally doing something.
   *
   * The current frame will be saved, after which the callback is
   * called with the log (already containing the new frame).
   *
   * For example, you can add a test or a debug statement in the
   * callback. Other uses include checking the position or state
   * of sprites.
   */
  log(callback: () => void = () => {}): ScheduledEvent {
    return this.constructNext(new CallbackAction(callback));
  }

  track(sprite: string): ScheduledEvent {
    return this.constructNext(new TrackSpriteAction(sprite));
  }

  trackBroadcast(...names: string[]): ScheduledEvent {
    return this.constructNext(new TrackBroadcasts(names));
  }

  /**
   * Click the "green flag". This is often the first thing you do.
   *
   * This event can be synchronous or not. If synchronous, all blocks
   * attached to the green flag hat will need to be completed before the
   * event resolves. Otherwise it resolves immediately.
   *
   * @param {boolean} sync - Synchronous or not, default true.
   * @param {number} timeout - How long to wait for synchronous events.
   * @return {ScheduledEvent}
   */
  greenFlag(sync = true, timeout?: number): ScheduledEvent {
    return this.constructNext(new GreenFlagAction(), sync, timeout);
  }

  /**
   * Click the sprite with the given name.
   *
   * This event can be asynchronous. If synchronous, all blocks attached
   * to hats listening to the click event must be completed before the
   * event resolves. Otherwise it resolves immediately.
   *
   * @param spriteName - The name of the sprite.
   * @param sync - Synchronous or not, default true.
   * @param timeout - How long to wait for synchronous events.
   */
  clickSprite(spriteName = 'Stage', sync = true, timeout?: number): ScheduledEvent {
    return this.constructNext(new ClickSpriteAction(spriteName), sync, timeout);
  }

  /**
   * Send a broadcast of the specified signal.
   *
   * This event can be asynchronous. If synchronous, all blocks attached
   * to hats listening to the given broadcast must be completed before
   * the event resolves. Otherwise it resolves immediately.
   *
   * If synchronous, resembles a "Broadcast () and Wait" block, otherwise
   * resembles a "Broadcast ()" block.
   *
   * The event is logged with event type `broadcast`.
   *
   * @see https://en.scratch-wiki.info/wiki/Broadcast_()_(block)
   * @see https://en.scratch-wiki.info/wiki/Broadcast_()_and_Wait_(block)
   *
   * @param broadcast - The name of the broadcast to send.
   * @param sync - Synchronous or not, default true.
   * @param timeout - How long to wait for synchronous events.
   */
  sendBroadcast(
    broadcast: string | { name: string; restrict: (c: Context) => Target },
    sync = true,
    timeout?: number,
  ): ScheduledEvent {
    let name;
    let restrict;
    if (typeof broadcast === 'string') {
      name = broadcast;
      restrict = undefined;
    } else {
      name = broadcast.name;
      restrict = broadcast.restrict;
    }
    return this.constructNext(new SendBroadcastAction(name, restrict), sync, timeout);
  }

  /**
   * Simulate a key press.
   *
   * The difference between this event and the `useKey` event is similar
   * to the difference between the "When () Key Pressed" block and the
   * "Key () Pressed?" block.
   *
   * This event will activate all hats with the "When () Key Pressed"
   * block. This means it simulates a full "key press", meaning pressing
   * it down and letting go. It has no impact on the current key status,
   * and will NOT trigger a `KEY_PRESSED` event.
   *
   * This event can be asynchronous. If synchronous, all blocks attached
   * to hats listening to the click event must be completed before the
   * event resolves. Otherwise it resolves immediately.
   *
   * @see https://en.scratch-wiki.info/wiki/Key_()_Pressed%3F_(block)
   * @see https://en.scratch-wiki.info/wiki/When_()_Key_Pressed_(Events_block)
   *
   * @param key - The name of the key to press.
   * @param sync - Synchronous or not, default true.
   * @param timeout - How long to wait for synchronous events.
   */
  pressKey(key: string, sync = true, timeout?: number): ScheduledEvent {
    return this.constructNext(new WhenPressKeyAction(key), sync, timeout);
  }

  /**
   * Use the keyboard.
   *
   * The difference between this event and the `pressKey` event is similar
   * to the difference between the "When () Key Pressed" block and the
   * "Key () Pressed?" block.
   *
   * This event will update the internal state of the keyboard. When you
   * send this event, the key will be pressed down, and kept that way.
   * As such, this key will trigger both "When () Key Pressed" blocks
   * and return true for "Key () Pressed?" blocks.
   *
   * To make life easier, you can optionally pass a time, after which the
   * key is lifted automatically.
   *
   * If no timeout is passed, the event is asynchronous. If a timeout is
   * passed, the event resolves after the key has been lifted if synchronous.
   *
   * Due to the nature of the event, it is currently not possible to wait
   * on completion of scripts with this event. This would mean basically
   * running scripts to see if they are waiting on this press or not, which
   * is not possible.
   *
   * Finally, since the event should at least be noticeable in the next step
   * of the Scratch VM, by default a 20 ms waiting time is introduced after
   * each key event (the delay). You can modify this delay by setting the last
   * parameter. In most cases, it is not necessary to adjust this.
   *
   * The time the key is pressed before it is released does not account for
   * the delay: if  `down` is 50ms, the key will be lifted after 50 ms.
   *
   * When using as a sync event, the total execution time will therefore be
   * delay + down. If down is true or false, the execution time will be just
   * the delay.
   *
   * The `useMouse` event is similar, but for the mouse.
   *
   * This event is logged with event type 'useKey'. The event saves the state
   * before the key press. The next frame of the event is saved after the delay
   * has been completed or before the key is lifted.
   *
   * @see https://en.scratch-wiki.info/wiki/Key_()_Pressed%3F_(block)
   * @see https://en.scratch-wiki.info/wiki/When_()_Key_Pressed_(Events_block)
   *
   * @param key - The key to press.
   * @param down - If a boolean, the key event will be passed as is. If a
   *        number, the key will first be set to down, but then lifted after the
   *        given amount of ms. By default, this is 10 ms.
   * @param sync - If the lifting of the key press should be async or sync. When
   *        no automatic lifting is used, the event is always async.
   * @param delay - The amount of time to wait after the last key press. You can
   *        set this to less than 10, but you risk that your key press will be
   *        undetected.
   */
  useKey(
    key: string,
    down: number | boolean = 60,
    sync = true,
    delay = 20,
  ): ScheduledEvent {
    return this.constructNext(new KeyUseAction(key, down, delay), sync);
  }

  /**
   * Use the mouse.
   *
   * At the moment you can pass all data to the mouse event, and thus
   * also simulate clicks. This is not supported and will probably break
   * in weird ways.
   *
   * This event is synchronous: the event resolves after the mouse data
   * has been posted to the Scratch VM.
   *
   * This updates the mouse data in the VM, and keeps it like that. E.g.
   * if you move the mouse to x+5, y-5, it will stay there.
   */
  useMouse(data: MouseData): ScheduledEvent {
    return this.constructNext(new MouseUseAction(data));
  }

  /**
   * A utility function that allows to run a function to schedule events.
   *
   * This function is mainly intended to allow better organisation of code
   * when writing test plans. The callback will be executed with the current
   * event as argument and is expected to return the next anchor event.
   *
   *
   * @example
   * // without this function
   * function scheduleStuff(e) {
   *   return e.wait(10);
   * }
   *
   * function duringExecution(e) {
   *   let events = e.scheduler.wait(10);
   *   events = scheduleStuff(events);
   * }
   *
   * @example
   * // with this function
   * function scheduleStuff(e) {
   *   return e.wait(10);
   * }
   *
   * function duringExecution(e) {
   *   e.scheduler
   *    .wait(10)
   *    .run(scheduleStuff);
   * }
   */
  pipe(provider: (e: ScheduledEvent) => ScheduledEvent): ScheduledEvent {
    return provider(this);
  }

  /**
   * Joins the scheduled event threads, ie. waits until
   * one of the events is resolved. This could be considered the
   * opposite of "forking" the threads.
   *
   * Technically speaking, this will add an event on the first
   * event as anchor, which will only resolve if one of the other events
   * is resolved.
   */
  join(events: ScheduledEvent[], timeout?: number): ScheduledEvent {
    return this.constructNext(new JoinAction(events), true, timeout);
  }

  /**
   * Add a callback to the current event that will be called if the event is successfully
   * resolved.
   *
   * As always, synchronous events are resolved after the event is done, while asynchronous
   * events are immediately resolved.
   *
   * If an event errors, the callback will not be called.
   *
   * Calling this function multiple times on the same event will discard previous
   * calls.
   */
  resolved(callback: (c: Context) => void): ScheduledEvent {
    this.onResolve = callback;
    return this;
  }

  /**
   * Add a callback to the current event that will be called if the event times out.
   *
   * As always, only synchronous events can time out.
   *
   * If an event errors, the callback will not be called.
   *
   * Calling this function multiple times on the same event will discard previous
   * calls.
   */
  timedOut(callback: (c: Context) => boolean | null): ScheduledEvent {
    this.onTimeout = callback;
    return this;
  }

  /**
   * Allow to use the event as a test. If successful,
   * the event will be reported as a passing test with the message.
   * Otherwise it will be a failing test with the message.
   *
   * @return {ScheduledEvent}
   */
  asTest(messages?: MessageData): ScheduledEvent {
    const wrapped = {
      correct: castCallback(messages?.correct),
      wrong: castCallback(messages?.wrong),
    };

    this.resolved((context) => {
      context.output.startTest(true);
      const message = wrapped.correct();
      if (message) {
        context.output.appendMessage(message);
      }
      context.output.closeTest(true, true);
    });
    this.timedOut((context) => {
      context.output.startTest(true);
      const message = wrapped.wrong();
      if (message) {
        context.output.appendMessage(message);
      }
      context.output.closeTest(false, false);
      return true;
    });

    return this;
  }

  /**
   * Set the value of a variable on a target.
   *
   * This event is always synchronous.
   *
   *
   * @param target - Name of the target sprite.
   * @param name - Name of the variable.
   * @param value - The value to set it to.
   */
  setVariableTo(name: string, value: unknown, target = 'Stage'): ScheduledEvent {
    return this.constructNext(new SetVariableAction(target, name, value));
  }
}
