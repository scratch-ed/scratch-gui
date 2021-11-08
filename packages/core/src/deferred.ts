/**
 * A "Deferred" like implementation on top of a Promise.
 */
export class Deferred<Result> {
  /**
   * The promise. Use this to await completion.
   */
  promise: Promise<Result>;
  /**
   * Call to resolve the underlying promise.
   */
  resolve!: (result: Result) => void;
  /**
   * Call to reject the underlying promise.
   */
  reject!: (error: Error) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
