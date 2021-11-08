import { Context } from '../context';

/**
 * Base class for scheduled actions.
 *
 * When implementing an action, you should override the `execute` function.
 * Its docs contain information on what to do.
 *
 * This is a class internal to the judge; do not use it in testplans.
 *
 * @package
 */
export abstract class ScheduledAction {
  /**
   * Execute the action. This should do what the action is supposed to do,
   * but should not concern itself with scheduling details.
   *
   * This method should be "sync": the resolve callback must be called when
   * the event is done, async or not. The framework will take care of the
   * async/sync scheduling.
   *
   * @param _context - The context.
   * @param _resolve - Mark the action as done.
   */
  abstract execute(_context: Context, _resolve: (value: string) => void): void;

  /**
   * Human readable string representation. The default implementation
   * returns the class name, but you should override this to add relevant
   * params.
   */
  toString(): string {
    return this.constructor.name;
  }
}
