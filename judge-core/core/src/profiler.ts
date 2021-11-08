import type VirtualMachine from '@ftrprf/judge-scratch-vm-types/types/virtual-machine';
import { Context } from './context';

class ProfiledBlock {
  constructor(
    readonly opcode: string,
    readonly args: Record<string, unknown>,
    readonly timestamp: number,
    readonly target?: string,
  ) {}
}

/**
 * An advanced profiler that will collect information on all
 * executed blocks in Scratch.
 *
 * TODO: use the unified logged block for this.
 */
export class AdvancedProfiler {
  executions: ProfiledBlock[] = [];

  register(vm: VirtualMachine, context: Context): void {
    const execs = this.executions;
    // Attach the advanced profiler.
    for (const [opcode, blockFunction] of Object.entries(vm.runtime._primitives)) {
      vm.runtime._primitives[opcode] = new Proxy(blockFunction, {
        apply: function (target, thisArg, argumentsList) {
          const targetName = argumentsList[1].target.getName();
          execs.push(
            new ProfiledBlock(opcode, argumentsList[0], context.timestamp(), targetName),
          );
          return target.apply(thisArg, argumentsList);
        },
      });
    }
  }
}
