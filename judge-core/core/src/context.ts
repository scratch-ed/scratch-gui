import VirtualMachine from 'scratch-vm';
import ScratchStorage from 'scratch-storage';
import ScratchSVGRenderer from 'scratch-svg-renderer';
import AudioEngine from 'scratch-audio';
import ScratchRender from 'scratch-render';

import type Runtime from '@ftrprf/judge-scratch-vm-types/types/engine/runtime';

import { Log, LogEvent, LogFrame } from './log';
import { Deferred } from './deferred';
import { makeProxiedRenderer } from './renderer';
import { ResultManager, WRONG } from './output';
import { ScheduledEvent } from './scheduler/scheduled-event';
import { EndAction } from './scheduler/end';
import { BroadcastReceiver, ThreadListener } from './listener';
import { EvalConfig } from './evaluation';
import { AdvancedProfiler } from './profiler';

const Events: Record<string, string> = {
  SCRATCH_PROJECT_START: 'PROJECT_START',
  SCRATCH_PROJECT_RUN_STOP: 'PROJECT_RUN_STOP',
  SCRATCH_SAY_OR_THINK: 'SAY',
  SCRATCH_QUESTION: 'QUESTION',
  SCRATCH_ANSWER: 'ANSWER',
  // Custom events,
  DONE_THREADS_UPDATE: 'DONE_THREADS_UPDATE',
  BEFORE_HATS_START: 'BEFORE_HATS_START',
};

/**
 * Wrap the stepper function.
 *
 * @param {VirtualMachine} vm
 * @param {Context} context
 */
function wrapStep(vm: VirtualMachine, context?: Context) {
  const oldFunction = vm.runtime._step.bind(vm.runtime);

  vm.runtime._step = () => {
    const oldResult = oldFunction();
    if (vm.runtime._lastStepDoneThreads.length > 0) {
      vm.runtime.emit(Events.DONE_THREADS_UPDATE, vm.runtime._lastStepDoneThreads);
    }

    if (context) {
      const slider = document.getElementById("time-slider");
      if (slider) {
        const maxValue = (context.log.frames.length - 1).toString();
        slider.setAttribute("max", maxValue);
        // slider.setAttribute("value", maxValue);
      }

      const markings = document.getElementById("error-marks");
      if (markings) {
        markings.innerHTML = '';
        context.log.frames.forEach((frame, i) => {
          const option = document.createElement('option');
          option.value = i.toString();
          markings.appendChild(option);
        });
      }
    }

    return oldResult;
  };
}

/**
 * Wrap the start hats function to emit an event when this happens.
 * @param {VirtualMachine} vm
 */
function wrapStartHats(vm: VirtualMachine) {
  const oldFunction = vm.runtime.startHats.bind(vm.runtime);

  vm.runtime.startHats = (requestedHatOpcode, optMatchFields, optTarget) => {
    vm.runtime.emit(Events.BEFORE_HATS_START, {
      requestedHatOpcode,
      optMatchFields,
      optTarget,
    });
    return oldFunction(requestedHatOpcode, optMatchFields, optTarget);
  };
}

/**
 * Load the VM. The returned VM is completely prepared: listeners
 * are attached, dependencies loaded and the project is loaded into
 * the VM.
 *
 * @param vm - The VM to load.
 * @param project - The project to load.
 * @param canvas - The canvas for the renderer.
 * @param context - The context. The VM part of the context is not loaded yet.
 * @return The virtual machine.
 */
async function loadVm(
  vm: VirtualMachine,
  project: string | ArrayBuffer,
  canvas: HTMLCanvasElement,
  context?: Context,
) {
  vm.setTurboMode(false);

  // Set up the components.
  const storage = new ScratchStorage();
  vm.attachStorage(storage);
  const audioEngine = new AudioEngine();
  vm.attachAudioEngine(audioEngine);
  vm.attachV2SVGAdapter(new ScratchSVGRenderer.SVGRenderer());
  vm.attachV2BitmapAdapter(new ScratchSVGRenderer.BitmapAdapter());

  // Set up the renderer, and inject our proxy.
  if (typeof context !== 'undefined') {
    const renderer = makeProxiedRenderer(context, canvas);
    vm.attachRenderer(renderer);
  } else {
    vm.attachRenderer(new ScratchRender(canvas));
  }

  if (context !== null) {
    // Wrap the step function.
    wrapStep(vm, context);
    wrapStartHats(vm);
  }

  // Load the project.
  await vm.loadProject(project);

  return vm;
}

/**
 * @typedef {object} Acceleration
 * @property {number} factor - Main acceleration factor.
 * @property {number} [time] - Scratch waiting times.
 * @property {number} [event] - Scheduled events waiting time.
 */
interface Acceleration {
  factor: number;
  time?: number;
  event?: number;
}

/**
 * Contains common information and parameters for the
 * judge. This is passed around in lieu of using globals.
 */
export class Context {
  vm?: VirtualMachine;
  /**
   * When the execution started.
   */
  startTime: number;
  numberOfRun: number;
  log: Log;
  answers: string[];
  providedAnswers: string[];
  /**
   * Resolves once the scratch files have been loaded.
   */
  vmLoaded: Deferred<string>;
  /**
   * Resolves once the simulation has ended.
   */
  simulationEnd: Deferred<string>;
  /**
   * The timeout for the actions.
   */
  actionTimeout: number;
  /**
   * The listeners for the threads.
   */
  threadListeners: ThreadListener[];
  broadcastListeners: BroadcastReceiver[];
  event: ScheduledEvent;
  output: ResultManager;
  // TODO: integrate with log.
  advancedProfiler: AdvancedProfiler;

  /**
   * The acceleration factor, used to speed up (or slow down)
   * execution in the VM.
   *
   * There is a limit on how much you can increase this, since
   * each step in the VM must still have time to run of course.
   */
  accelerationFactor: Acceleration;

  constructor() {
    this.startTime = Date.now();
    this.numberOfRun = 0;
    this.log = new Log();
    this.answers = [];
    this.providedAnswers = [];
    this.vmLoaded = new Deferred();
    this.simulationEnd = new Deferred();
    this.actionTimeout = 5000;
    this.threadListeners = [];
    this.broadcastListeners = [];
    this.event = ScheduledEvent.create();
    this.output = new ResultManager();
    this.advancedProfiler = new AdvancedProfiler();
    this.accelerationFactor = {
      factor: 1,
    };
  }

  /**
   * Get a current timestamp.
   * @return {number}
   */
  timestamp(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Set up the event handles for a the vm.
   * @private
   */
  attachEventHandles(): void {
    this.vm!.runtime.on(Events.SCRATCH_PROJECT_START, () => {
      console.log(`${this.timestamp()}: run number: ${this.numberOfRun}`);
      this.numberOfRun++;
    });

    this.vm!.runtime.on(Events.SCRATCH_SAY_OR_THINK, (target, type, text) => {
      // Only save it when something is actually being said.
      if (text !== '') {
        console.log(`${this.timestamp()}: say: ${text} with ${type}`);

        const event = new LogEvent(this, 'say', {
          text: text,
          target: target,
          type: type,
          sprite: target.sprite.name,
        });
        event.previousFrame = new LogFrame(this, 'say');
        event.nextFrame = new LogFrame(this, 'sayEnd');
        this.log.addEvent(event);
      }
    });

    this.vm!.runtime.on(Events.SCRATCH_QUESTION, (question) => {
      if (question != null) {
        let x = this.providedAnswers.shift();
        if (x === undefined) {
          this.output.appendMessage(
            'Er werd een vraag gesteld waarop geen antwoord voorzien is.',
          );
          this.output.escalateStatus(WRONG);
          x = undefined;
        }

        console.log(`${this.timestamp()}: input: ${x}`);

        const event = new LogEvent(this, 'answer', {
          question: question,
          text: x,
        });
        event.previousFrame = new LogFrame(this, 'answer');
        event.nextFrame = new LogFrame(this, 'answerEnd');
        this.log.addEvent(event);

        this.vm!.runtime.emit(Events.SCRATCH_ANSWER, x);
      }
    });

    this.vm!.runtime.on(Events.SCRATCH_PROJECT_RUN_STOP, () => {
      console.log(`${this.timestamp()}: Ended run`);
    });

    this.vm!.runtime.on(Events.DONE_THREADS_UPDATE, (threads) => {
      for (const thread of threads) {
        for (const action of this.threadListeners) {
          if (action.active) {
            action.update(thread);
          }
        }
      }
    });

    this.vm!.runtime.on(Events.BEFORE_HATS_START, (opts) => {
      if (opts.requestedHatOpcode === 'event_whenbroadcastreceived') {
        this.broadcastListeners
          .filter((l) => l.active)
          .forEach((l) =>
            l.update({
              matchFields: opts.optMatchFields,
              target: opts.optTarget,
            }),
          );
      }
    });
  }

  /**
   * Create a profile and attach it to the VM.
   * @private
   */
  createProfiler(): void {
    this.vm!.runtime.enableProfiling();
    const blockId = this.vm!.runtime.profiler.idByName('blockFunction');
    this.vm!.runtime.profiler.onFrame = (frame) => {
      if (frame.id === blockId) {
        this.log.addFrame(this, frame.arg);
      }
    };

    this.advancedProfiler.register(this.vm!, this);
  }

  /**
   * Extract the project.json from a sb3 project.
   *
   * If you need the project JSON from the actual project you want to test,
   * it's more efficient to use `prepareVm`, since that will re-use the created
   * VM.
   */
  // eslint-disable-next-line
  async getProjectJson(config: EvalConfig): Promise<Record<string, any>> {
    if (!this.vm) {
      this.vm = new VirtualMachine();
    }
    await loadVm(this.vm, config.template, config.canvas);
    return JSON.parse(this.vm.toJSON());
  }

  /**
   * Set-up the scratch vm. After calling this function,
   * the vmLoaded promise will be resolved.
   */
  // eslint-disable-next-line
  async prepareVm(config: EvalConfig): Promise<Record<string, any>> {
    if (!this.vm) {
      this.vm = new VirtualMachine();
    }
    /**
     * The scratch virtual machine.
     *
     * @type {VirtualMachine};
     */
    await loadVm(this.vm, config.submission, config.canvas, this);
    // Attach handlers
    this.attachEventHandles();

    // Enable profiling.
    this.createProfiler();

    console.log('Loading is finished.');
    this.vmLoaded.resolve('loading is finished');

    return JSON.parse(this.vm.toJSON());
  }

  /**
   * Prepare the VM for execution. This will prepare the answers for
   * questions (if applicable) and instrument the VM to take the
   * acceleration factor into account.
   */
  prepareAndRunVm(): void {
    this.providedAnswers = this.answers.slice();

    // Optimisation.
    if (this.accelerationFactor.time !== 1) {
      // We need to instrument the VM.
      // Changing the events is not necessary; this
      // is handled by the event scheduler itself.

      // First, modify the step time.
      const currentStepInterval = (<typeof Runtime>this.vm!.runtime.constructor)
        .THREAD_STEP_INTERVAL;
      const newStepInterval = currentStepInterval / this.accelerationFactor.factor;

      Object.defineProperty(this.vm!.runtime.constructor, 'THREAD_STEP_INTERVAL', {
        value: newStepInterval,
      });

      // We also need to change various time stuff.
      this.acceleratePrimitive('control_wait', 'DURATION');
      this.acceleratePrimitive('looks_sayforsecs');
      this.acceleratePrimitive('looks_thinkforsecs');
      this.acceleratePrimitive('motion_glidesecstoxy');
      this.acceleratePrimitive('motion_glideto');

      this.accelerateTimer();
    }

    // Start the vm.
    this.vm!.start();
  }

  /**
   * Adjust the given argument for a given opcode to the acceleration factor.
   *
   * This is used to modify "time" constants to account for the acceleration factor.
   * For example, if a condition is "wait for 10 seconds", but the acceleration factor
   * is 2, we only want to wait for 5 seconds, not 10.
   *
   * @param opcode - The opcode to accelerate.
   * @param argument - The argument to accelerate.
   *
   * @private
   */
  acceleratePrimitive(opcode: string, argument = 'SECS'): void {
    const original = this.vm!.runtime.getOpcodeFunction(opcode);
    const factor = this.accelerationFactor.time || this.accelerationFactor.factor;
    this.vm!.runtime._primitives[opcode] = (
      originalArgs: Record<string, unknown>,
      util: unknown,
    ) => {
      // For safety, clone the arguments.
      const args = { ...originalArgs };
      args[argument] = <number>args[argument] / factor;
      return original(args, util);
    };
  }

  /**
   * Adjust the given method on the given device to account for the
   * acceleration factor.
   *
   * This is mainly used to reverse accelerate the project timer.
   * E.g. if the project timer is counts 10s for a project with
   * acceleration factor 2, it should count 20s instead.
   */
  accelerateTimer(): void {
    const factor = this.accelerationFactor.time || this.accelerationFactor.factor;
    const device = this.vm!.runtime.ioDevices.clock;
    const original = device.projectTimer;

    device.projectTimer = () => {
      return original.call(device) * factor;
    };
  }

  /**
   * Accelerate a certain number. This is intended for events.
   *
   * @param number - The number to accelerate. All non-numbers are returned as is.
   */
  accelerateEvent<T>(number: number | T): number | T {
    const factor = this.accelerationFactor.event || this.accelerationFactor.factor;
    if (factor === 1 || typeof number !== 'number') {
      return number;
    }
    return number / factor;
  }

  terminate(): void {
    const action = new EndAction();
    action.execute(this, () => {});
  }

  /**
   * Create a context with a fully prepared VM.
   */
  static async create(config: EvalConfig): Promise<Context> {
    const context = new Context();
    await context.prepareVm(config);
    return context;
  }
}
