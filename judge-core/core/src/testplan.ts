/**
 * @file This file contains the testplan API, i.e. most of the stuff
 * you use when writing a test plan. This API is inspired by Jest, so
 * if you are familiar, it should be fairly easy to pick up.
 *
 * ## Structure
 *
 * Itch provides 4 levels of groupings for tests:
 *
 * 1. `tab`
 * 2. `describe`
 * 3. `test`
 * 4. `expect`
 *
 * When starting from the bottom, we begin simple:
 *
 * 1. The `expect` is used to compare two values. It does not have a name itself,
 *    but you can provide a custom error message. This is only shown when the
 *    assertion fails. (The values are always passed as well).
 * 2. The `test` is the lowest level with a name. It groups a bunch of related
 *    `expect` statements.
 * 3. The `describe` directive groups a bunch of related tests, e.g. for one sprite.
 * 4. The `tab` groups a bunch of `describe` statements. These are mainly for UI purposes.
 */
import isEqual from 'lodash-es/isEqual';
import { CORRECT, WRONG } from './output';
import { castCallback, MessageData, numericEquals } from './utils';
import { Context } from './context';
import { Project } from './project';
import { Evaluation } from './evaluation';
import { Sb3Block, Sb3Target } from './structures';

import type VirtualMachine from '@ftrprf/judge-scratch-vm-types';
import type BlockUtility from '@ftrprf/judge-scratch-vm-types/types/engine/block-utility';
import { LoggedSprite } from './log';
import { cloneDeep } from 'lodash-es';

export class FatalErrorException extends Error {}

class GenericMatcher {
  context: Context;
  actual: unknown;
  errorMessage?: (expected: unknown, actual: unknown) => string;
  successMessage?: (expected: unknown, actual: unknown) => string;
  terminate = false;
  expected: unknown;

  constructor(context: Context, actual: unknown) {
    this.context = context;
    this.actual = actual;
  }

  /**
   * Post the result.
   *
   * @param accepted - If the property satisfies the condition.
   * @param [errorMessage] - Default error message.
   * @param [successMessage] - Optional success message.
   */
  private out(accepted: boolean, errorMessage?: string, successMessage?: string) {
    this.context.output.startTest(this.expected);
    const status = accepted ? CORRECT : WRONG;

    if (accepted) {
      const message = this.successMessage
        ? this.successMessage(this.expected, this.actual)
        : successMessage;
      if (message) {
        this.context.output.appendMessage(message);
      }
    } else {
      const message = this.errorMessage
        ? this.errorMessage(this.expected, this.actual)
        : errorMessage;
      if (message) {
        this.context.output.appendMessage(message);
      }
    }

    this.context.output.closeTest(this.actual, accepted, status);

    if (!accepted && this.terminate) {
      throw new FatalErrorException();
    }
  }

  /**
   * Allows setting an error message.
   * @deprecated
   */
  withError(
    message: string | ((expected: unknown, actual: unknown) => string),
  ): GenericMatcher {
    this.errorMessage = castCallback(message);
    return this;
  }

  /**
   * Provide custom messages as output.
   */
  with(messages: MessageData): GenericMatcher {
    this.successMessage = castCallback(messages.correct);
    this.errorMessage = castCallback(messages.wrong);
    return this;
  }

  /**
   * Mark this test as fatal: if it fails, the testplan will stop.
   */
  fatal(): GenericMatcher {
    this.terminate = true;
    return this;
  }

  /**
   * Compares two values for equality.
   *
   * Most types of objects should be supported:
   *
   * - If both values are numbers, `numericEquals` is used, which supports floats.
   * - Otherwise, the `isEqual` function from lodash is used. Quoting their docs:
   *
   *   > This method supports comparing arrays, array buffers, booleans,
   *   > date objects, error objects, maps, numbers, `Object` objects, regexes,
   *   > sets, strings, symbols, and typed arrays. `Object` objects are compared
   *   > by their own, not inherited, enumerable properties. Functions and DOM
   *   > nodes are **not** supported.
   */
  toBe(expected: unknown): void {
    this.expected = expected;
    if (typeof this.actual === 'number' && typeof expected === 'number') {
      this.out(
        numericEquals(this.actual, expected),
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`,
      );
    } else {
      this.out(
        isEqual(this.actual, expected),
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`,
      );
    }
  }

  /**
   * Compares two values for equality.
   *
   * Most types of objects should be supported:
   *
   * - If both values are numbers, `numericEquals` is used, which supports floats.
   * - Otherwise, the `isEqual` function from lodash is used. Quoting their docs:
   *
   *   > This method supports comparing arrays, array buffers, booleans,
   *   > date objects, error objects, maps, numbers, `Object` objects, regexes,
   *   > sets, strings, symbols, and typed arrays. `Object` objects are compared
   *   > by their own, not inherited, enumerable properties. Functions and DOM
   *   > nodes are **not** supported.
   */
  toNotBe(expected: unknown): void {
    this.expected = expected;
    if (typeof this.actual === 'number' && typeof expected === 'number') {
      this.out(
        !numericEquals(this.actual, expected),
        `Expected not ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`,
      );
    } else {
      this.out(
        !isEqual(this.actual, expected),
        `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`,
      );
    }
  }
}

class ExpectLevel {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  /**
   * Start an assertion be providing a value.
   */
  expect(value: unknown): GenericMatcher {
    return new GenericMatcher(this.context, value);
  }

  /**
   * Add a test that will always be accepted.
   */
  accept(): void {
    this.context.output.startTest(true);
    this.context.output.closeTest(true, true);
  }
}

class TestLevel {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  /**
   * Check some properties as part of the same test.
   *
   * ### Test vs expect
   *
   * A good guideline to decide whether testing multiple properties
   * should happen in the same file or not: if it needs a name, it should
   * be a separate test.
   *
   * For example, if you are testing that a sprite moves down when pressing a key,
   * you might have one test, with two properties: one for x and one for y.
   *
   * On the other hand, you might want to have multiple tests: one for the position,
   * one for the orientation, etc.
   *
   * This level results in a `testcase` in the output format.
   */
  test(name: string, block: (out: ExpectLevel) => void) {
    this.context.output.startTestcase(name);
    block(new ExpectLevel(this.context));
    this.context.output.closeTestcase();
  }
}

class DescribeLevel extends TestLevel {
  /**
   * Groups a bunch of related tests.
   *
   * This level results in a `context` in the output format.
   *
   * @param name - Either the name or the function.
   * @param block - The function if a name is passed.
   */
  describe(name: string, block: (out: TestLevel) => void) {
    this.context.output.startContext(name);
    block(this);
    this.context.output.closeContext();
  }
}

export class TabLevel extends DescribeLevel {
  /**
   * Run the tests in the block inside the tab.
   *
   * This level results in a `tab` in the output format.
   */
  tab(name: string, block: (out: DescribeLevel) => void): void {
    this.context.output.startTab(name);
    block(this);
    this.context.output.closeTab();
  }
}

function removeAttached(block: Sb3Block, from: Sb3Target | null): Sb3Block[] {
  // We remove all attached code from the hat block in the solution.
  const toCheck = new Set();
  toCheck.add(block.id);
  const toRemoveIds = new Set();
  const removedBlocks: Sb3Block[] = [];
  while (toCheck.size !== 0) {
    const checking = toCheck.values().next().value;
    from?.blocks
      ?.filter((b) => b.parent === checking)
      ?.forEach((b) => {
        if (!toRemoveIds.has(b.id)) {
          toRemoveIds.add(b.id);
          removedBlocks.push(b);
          toCheck.add(b.id);
        }
      });
    toCheck.delete(checking);
  }

  return removedBlocks;
}

function fixHatBlock(filteredBlocks: Sb3Block[], hatBlock: Sb3Block) {
  const solutionIndex = filteredBlocks.findIndex((b) => b.id === hatBlock.id);
  hatBlock.next = null;
  filteredBlocks[solutionIndex] = hatBlock;
}

// export function difference(object, base) {
//   function changes(object, base) {
//     return _.transform(object, function(result, value, key) {
//       if (!_.isEqual(value, base[key])) {
//         result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
//       }
//     });
//   }
//   return changes(object, base);
// }

export class OneHatAllowedTest {
  private template: Project;
  private submission: Project;

  private ignoredSprites: string[] = ['Stage'];

  hatSprites: string[];
  /** @deprecated */
  hatSprite?: string;
  /** @deprecated */
  hatBlockFinder?: (value: Sb3Block, index: number, obj: Sb3Block[]) => boolean;
  /** @deprecated */
  allowedBlockCheck?: (value: Sb3Block, index: number, array: Sb3Block[]) => boolean;

  hatBlockFinders: Record<
    string,
    (value: Sb3Block, index: number, obj: Sb3Block[]) => boolean
  > = {};

  allowedBlockChecks: Record<
    string,
    (value: Sb3Block, index: number, array: Sb3Block[]) => boolean
  > = {};

  hatBlockSorter: (list: Sb3Block[]) => Sb3Block[] = (l) => l;

  constructor(template: Project, submission: Project) {
    this.template = template;
    this.submission = submission;
    this.hatSprites = [];
  }

  ignoredSprite(sprite: string): void {
    this.ignoredSprites.push(sprite);
  }

  execute(e: Evaluation): void {
    if (this.hatSprite) {
      this.hatSprites = [this.hatSprite];
    }
    if (this.hatBlockFinder) {
      this.hatBlockFinders = {};
      this.hatSprites.forEach((sprite) => {
        this.hatBlockFinders[sprite] = this.hatBlockFinder!;
      });
    }
    if (this.allowedBlockCheck) {
      this.allowedBlockChecks = {};
      this.hatSprites.forEach((sprite) => {
        this.allowedBlockChecks[sprite] = this.allowedBlockCheck!;
      });
    }
    e.describe('Controle op bestaande code', (l) => {
      this.template
        .sprites()
        .filter(
          (s) =>
            !this.ignoredSprites.includes(s.name) && !this.hatSprites.includes(s.name),
        )
        .map((s) => s.name)
        .forEach((sprite) => {
          l.test(sprite, (l) => {
            l.expect(this.template.hasChangedSprite(this.submission, sprite))
              .with({
                correct: `Top! Je hebt niets veranderd aan de sprite ${sprite}.`,
                wrong: `Oops, je hebt iets veranderd aan de sprite ${sprite}. Je gaat opnieuw moeten beginnen.`,
              })
              .toBe(false);

            l.expect(this.template.hasChangedBlocks(this.submission, sprite))
              .with({
                correct: `Top! Je hebt niets veranderd aan de blokjes van sprite ${sprite}.`,
                wrong: `Oops, je hebt iets veranderd aan de blokjes sprite ${sprite}. Je gaat opnieuw moeten beginnen.`,
              })
              .toBe(false);
          });
        });

      l.test('Speelveld', (l) => {
        l.expect(this.template.hasChangedSprite(this.submission, 'Stage'))
          .with({
            correct: `Top! Je hebt niets veranderd aan het speelveld.`,
            wrong: `Oops, je hebt iets veranderd aan het speelveld. Je gaat opnieuw moeten beginnen.`,
          })
          .toBe(false);

        l.expect(this.template.hasChangedBlocks(this.submission, 'Stage'))
          .with({
            correct: `Top! Je hebt niets veranderd aan de blokjes van het speelveld.`,
            wrong: `Oops, je hebt iets veranderd aan de blokjes van het speelveld. Je gaat opnieuw moeten beginnen.`,
          })
          .toBe(false);
      });

      if (this.hatSprites.length === 0) {
        throw new Error('You must define a hat sprite before executing these tests.');
      }

      for (const hatSprite of this.hatSprites) {
        const solutionHatSprite = cloneDeep(this.submission.sprite(hatSprite));

        if (!solutionHatSprite) {
          l.test(hatSprite, (l) => {
            l.expect(true)
              .fatal()
              .with({
                wrong: `Oei, je verwijderde de sprite ${hatSprite}. Je zal opnieuw moeten beginnen.`,
              })
              .toBe(false);
          });
        }

        const templateHatSprite = cloneDeep(this.template.sprite(hatSprite))!;
        // We test as follows: remove all blocks attached to the hat block.
        // The remaining blocks should be identical to the template sprite.
        // Start by finding the hat block (in the template, guaranteed to exist).
        const hatBlockFinder = this.hatBlockFinders[hatSprite];
        let solutionHatBlocks: Sb3Block[] =
          solutionHatSprite?.blocks?.filter(hatBlockFinder) || [];
        let templateHatBlocks: Sb3Block[] =
          templateHatSprite.blocks.filter(hatBlockFinder);

        if (
          solutionHatBlocks.length === 0 ||
          solutionHatBlocks.length !== templateHatBlocks.length
        ) {
          l.test(hatSprite, (l) => {
            l.expect(true)
              .fatal()
              .with({
                wrong: `Oei, je verwijderde een noodzakelijk blokje bij de sprite ${hatSprite}`,
              })
              .toBe(false);
          });
        }

        // We remove all attached code from the hat block in the solution.
        solutionHatBlocks = this.hatBlockSorter(solutionHatBlocks);
        templateHatBlocks = this.hatBlockSorter(templateHatBlocks);

        const removedSolutionBlocks: Sb3Block[] = [];
        const removedTemplateBlocks: Sb3Block[] = [];

        for (let i = 0; i < solutionHatBlocks.length; i++) {
          const solutionHatBlock = solutionHatBlocks[i];
          const templateHatBlock = templateHatBlocks[i];

          removedSolutionBlocks.push(
            ...removeAttached(solutionHatBlock, solutionHatSprite),
          );
          removedTemplateBlocks.push(
            ...removeAttached(templateHatBlock, templateHatSprite),
          );
        }

        const removedSolutionBlockIds = new Set(removedSolutionBlocks.map((b) => b.id));
        const removedTemplateBlockIds = new Set(removedTemplateBlocks.map((b) => b.id));

        const filteredSolutionBlocks = solutionHatSprite?.blocks?.filter(
          (b) => !removedSolutionBlockIds.has(b.id),
        );
        // Fix next block. Needed because the solution might contain a next block.
        if (filteredSolutionBlocks) {
          solutionHatBlocks.forEach((block) => {
            fixHatBlock(filteredSolutionBlocks, block);
          });
        }

        const filteredTemplateBlocks = templateHatSprite.blocks.filter(
          (b) => !removedTemplateBlockIds.has(b.id),
        );
        templateHatBlocks.forEach((block) => {
          fixHatBlock(filteredTemplateBlocks, block);
        });

        const solutionTree =
          solutionHatSprite?.blockTree(filteredSolutionBlocks || []) || new Set();
        const templateTree = templateHatSprite.blockTree(filteredTemplateBlocks);

        l.test(hatSprite, (l) => {
          l.expect(solutionTree.size <= templateTree.size)
            .with({
              wrong: 'Probeer je rondslingerende blokjes te verwijderen of te gebruiken.',
              correct: 'Goed zo! Je hebt geen losse blokjes laten rondslingeren.',
            })
            .toBe(true);
          if (solutionTree.size <= templateTree.size) {
            // if (!isEqual(templateTree, solutionTree)) {
            //   const d = difference(templateTree, solutionTree);
            //   const t_a = Array.from(templateTree).sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
            //   const s_a = Array.from(solutionTree).sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
            //   for (let i = 0; i < t_a.length; i++) {
            //     if (!isEqual(t_a[i], s_a[i])) {
            //       const dd = difference(t_a[i], s_a[i]);
            //       debugger;
            //     }
            //   }
            //   console.log(d);
            // }
            l.expect(isEqual(templateTree, solutionTree))
              .fatal()
              .with({
                wrong: `Je hebt aan de voorgeprogrammeerde blokjes van de sprite ${hatSprite} wijzigingen aangebracht.`,
                correct: `Je hebt niets veranderd aan de voorgeprogrammeerde blokjes van de sprite ${hatSprite}.`,
              })
              .toBe(true);
          }
        });

        const allowedBlockCheck = this.allowedBlockChecks[hatSprite];

        if (allowedBlockCheck) {
          // Verify that only allowed blocks are used.
          const usesAllowed = removedSolutionBlocks.every(allowedBlockCheck);
          // Don't show if no blocks.
          if (removedSolutionBlocks.length > 0) {
            l.test('Juiste blokjes', (l) => {
              l.expect(usesAllowed)
                .fatal()
                .with({
                  wrong:
                    'Oei, je gebruikt de verkeerde blokjes. Je mag enkel de blokjes uit mijn blokken en eindige lussen gebruiken.',
                  correct: 'Goed zo! Je gebruikt geen verkeerde blokjes.',
                })
                .toBe(true);
            });
          }
        }
      }
    });
  }
}

/**
 * EXPERIMENTAL!
 *
 * Intercepts wait blocks in procedure definitions in the given sprite for the
 * given amount and ignores them.
 *
 * @param {VirtualMachine} vm
 * @param {string} sprite
 */
export function ignoreWaitInProcedureFor(vm: VirtualMachine, sprite: string): void {
  const original = vm.runtime._primitives.control_wait;
  vm.runtime._primitives.control_wait = (args: unknown, util: BlockUtility) => {
    // Big hack to ignore wait in movement steps.
    if (util.thread!.target.getName() === sprite) {
      const glowId = util.thread!.blockGlowInFrame;
      if (glowId) {
        let current = util.thread!.blockContainer.getBlock(glowId);
        while (current?.parent !== null) {
          current = util.thread!.blockContainer.getBlock(current.parent);
        }
        if (current?.opcode === 'procedures_definition') {
          console.log(`Skipping ... ${current?.opcode}`);
          return;
        }
      }
    }

    original(args, util);
  };
}

interface Range {
  min: number;
  max: number;
}

export function asRange(range: number | Range): Range {
  if (typeof range === 'number') {
    return { min: range, max: range };
  } else {
    return range;
  }
}

/**
 * Generate an error message for a sprite that is not in the correct position.
 *
 * @param sprite - The sprite from the log.
 * @param xRange - Range or number of allowed X values.
 * @param yRange - Range or number of allowed Y values.
 *
 * @return The message.
 */
export function generatePositionMessage(
  sprite: LoggedSprite,
  xRange: Range | number,
  yRange: Range | number,
): string {
  xRange = asRange(xRange);
  yRange = asRange(yRange);
  let message = `De sprite '${sprite.name}' moet `;

  let messageX = '';
  // First check x part.
  if (sprite.x < xRange.min) {
    messageX = 'meer naar links';
  } else if (sprite.x > xRange.max) {
    messageX = 'meer naar rechts';
  }

  let messageY = '';
  // First check x part.
  if (sprite.y < yRange.min) {
    messageY = 'meer omhoog';
  } else if (sprite.y > yRange.max) {
    messageY = 'meer omlaag';
  }

  message += messageX;
  if (messageX && messageY) {
    message += ' en ';
  }
  message += messageY;
  message += '.';
  return message;
}
