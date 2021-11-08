import last from 'lodash-es/last';
import first from 'lodash-es/first';
import isEqual from 'lodash-es/isEqual';
import uniq from 'lodash-es/uniq';
import cloneDeep from 'lodash-es/cloneDeep';

import { containsBlock, containsLoop, countExecutions } from './blocks';
import {
  dist,
  distSq,
  findSquares,
  findTriangles,
  Line,
  mergeLines,
  Position,
} from './lines';
import { ensure } from './utils';
import { Context } from './context';

import type RenderedTarget from '@ftrprf/judge-scratch-vm-types/types/sprites/rendered-target';
import type Target from '@ftrprf/judge-scratch-vm-types/types/engine/target';
import type Variable from '@ftrprf/judge-scratch-vm-types/types/engine/variable';

/**
 * Our own version of a variable. Basically a copy of a {@link Variable}.
 */
export class LoggedVariable {
  id: string;
  name: string;
  type: string;
  value: string | number | unknown[];

  /**
   * @param {Variable} variable - The source to copy from.
   */
  constructor(variable: Variable) {
    this.id = variable.id;
    this.name = variable.name;
    this.type = variable.type;
    this.value = cloneDeep(variable.value);
  }
}

/**
 * Our own version of a sprite. Basically a copy of a {@link RenderedTarget}.
 */
export class LoggedSprite {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  isStage: boolean;
  size: number;
  visible: boolean;
  tempo: number;
  draggable: boolean;
  volume: number;
  time: number;
  variables: LoggedVariable[];
  currentCostume: number;
  costume: string;
  costumeSize: number;
  isTouchingEdge: boolean;
  bounds: { left: number; right: number; top: number; bottom: number } | null;
  /** @deprecated */
  touchingSprites: { name: string; value: boolean }[];
  /** @deprecated */
  isTouchingSprite: { name: string; value: boolean }[];
  blocks: Record<string, Record<string, unknown>>;
  scripts: string[];

  /**
   * @param {RenderedTarget} target - The source to extract information from.
   * @param {Target[]} _targets - Other targets.
   */
  constructor(target: RenderedTarget, _targets: Target[]) {
    // Copy some properties
    this.id = target.id;
    this.name = target.getName();
    this.x = target.x;
    this.y = target.y;
    this.direction = target.direction;
    this.isStage = target.isStage;
    this.size = target.size;
    this.visible = target.visible;
    this.tempo = target.tempo;
    this.draggable = target.draggable;
    this.volume = target.volume;
    this.time = target.runtime.currentMSecs;
    // this.type = target.type;

    // Copy variables.
    this.variables = [];
    for (const varName of Object.keys(target.variables || {})) {
      this.variables.push(new LoggedVariable(target.lookupVariableById(varName)));
    }

    // Copy sprite information.
    this.currentCostume = target.currentCostume;
    this.costume = target.getCurrentCostume().name;
    this.costumeSize = target.getCurrentCostume().size;

    this.isTouchingEdge = target.isTouchingEdge();
    this.bounds = target.getBounds() as {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };

    // Get all targets that touch this one.
    this.touchingSprites = [];
    // for (const otherTarget of targets) {
    //   if (otherTarget.id === this.id) {
    //     // Skip self.
    //     continue;
    //   }
    //   this.touchingSprites.push({
    //     name: otherTarget.getName(),
    //     value: target.isTouchingSprite(otherTarget.getName()),
    //   });
    // }
    this.isTouchingSprite = this.touchingSprites;

    // Get blocks.
    this.blocks = target.blocks._blocks;
    this.scripts = target.blocks.getScripts();
  }

  /**
   * Check if this sprite contains a block with the given opcode.
   */
  hasBlock(opcode: string): boolean {
    return Object.values(this.blocks).some((block) => block.opcode === opcode);
  }

  blockList(): Record<string, unknown>[] {
    return Object.values(this.blocks);
  }

  touchesPosition(pos: Position, padding = 0): boolean {
    const { left, right, bottom, top } = this.bounds!;
    return (
      left - padding < pos.x &&
      pos.x < right + padding &&
      bottom - padding < pos.y &&
      pos.y < top + padding
    );
  }

  /**
   * Check if this sprite touches another sprite.
   *
   * @param {string} name The name of the other sprite.
   *
   * @return {boolean}
   */
  touches(name: string): boolean {
    return ensure(this.touchingSprites.find((ts) => ts.name === name)).value;
  }

  getVariable(name: string): LoggedVariable | null {
    for (const variable of this.variables) {
      if (variable.name === name) {
        return variable;
      }
    }
    return null;
  }
}

/**
 * One captured moment during execution.
 *
 * A frame consists of a snapshot of the current state of the sprites
 * at the moment the frame was saved.
 *
 * A frame is created from a block, and extracts information from the
 * Scratch VM.
 *
 * @example
 * let frame = new Frame('looks_nextcostume');
 */
export class LogFrame {
  /**
   * The timestamp of the frame.
   */
  time: number;
  /**
   * The name of the block that triggered this frame.
   */
  block: string;
  /**
   * The targets saved at this moment in the VM.
   */
  sprites: LoggedSprite[];

  /**
   * When a new frame is created, information from the current state of the targets is saved. Some properties, like if the target is touching another target,
   * are calculated before being saved.
   *
   * @param {Context} context - The scratch virtual machine.
   * @param {string} block - The block that triggered the frame saving.
   */
  constructor(context: Context, block: string) {
    this.time = context.timestamp();
    this.block = block;
    this.sprites = [];
    // For now we only save rendered targets.
    for (const target of context.vm!.runtime.targets) {
      this.sprites.push(new LoggedSprite(target, context.vm!.runtime.targets));
    }
  }

  /**
   * @param spriteName - The name of the sprite that has to be returned.
   *
   * @returns sprite - The found sprite or null if none was found.
   */
  getSprite(spriteName: string): LoggedSprite | null {
    for (const sprite of this.sprites) {
      if (sprite.name === spriteName) {
        return sprite;
      }
    }
    return null;
  }

  getSpriteOr(name: string): LoggedSprite {
    const sp = this.getSprite(name);
    return ensure(sp);
  }

  getSprites(name: string): LoggedSprite[] {
    return this.sprites.filter((s) => s.name === name);
  }

  /**
   * Check if two sprites were touching when the frame was captured.
   *
   * An exception will be thrown if the first sprite does not exist.
   *
   * @param first - The first sprite.
   * @param second - The second sprite.
   *
   * @return If they were touching ir not.
   * @deprecated
   */
  areTouching(first: string, second: string): boolean {
    const firstSprite = this.getSprite(first);

    if (firstSprite === null) {
      throw new TypeError(`Cannot check non existing sprite ${first}`);
    }

    return firstSprite.touches(second);
  }

  /**
   * @deprecated
   */
  isTouching(spriteName1: string, spriteName2: string): boolean {
    return this.areTouching(spriteName1, spriteName2);
  }
}

interface Constraints {
  before: number | null;
  after: number | null;
  type: string | null;
}

/**
 * Search for frames with the given constraints.
 *
 * @param frames - Frames to search.
 * @param constraints - Values to filter on.
 *
 * @return A new instance of this array with the filtered values.
 *
 * @deprecated
 */
export function searchFrames(frames: LogFrame[], constraints: Constraints): LogFrame[] {
  const before = constraints.before || ensure(last(frames)).time;
  const after = constraints.after || 0;
  const type = constraints.type || null;

  return frames.filter((f) => {
    return f.time >= after && f.time <= before && (f.block === type || type === null);
  });
}

/**
 * Saves render information.
 * TODO: review
 */
export class LogRenderer {
  index = 0;
  lines: Line[] = [];
  color: unknown = null;
  points: unknown[] = [];
  responses: unknown[] = [];
}

// TODO: review
export class LogEvent {
  time: number;
  type: string;
  data: Record<string, unknown>;
  nextFrame: LogFrame | null;
  previousFrame: LogFrame | null;

  constructor(context: Context, type: string, data: Record<string, unknown> = {}) {
    this.time = context.timestamp();
    this.type = type;
    this.data = data;
    this.nextFrame = null;
    this.previousFrame = null;
  }

  getNextFrame(): LogFrame | null {
    return this.nextFrame;
  }

  getPreviousFrame(): LogFrame | null {
    return this.previousFrame;
  }
}

class Events {
  list: LogEvent[];
  length: number;
  lastTime: number;

  constructor() {
    this.list = [];
    /** @deprecated */
    this.length = 0;
    /** @deprecated */
    this.lastTime = 0;
  }

  /** @deprecated */
  push(event: LogEvent) {
    this.list.push(event);
    this.length++;
    this.lastTime = event.time;
  }

  /** @deprecated */
  filter(arg: Record<string, unknown>) {
    const type = arg.type || 'all';
    const before = (arg.before as number) || this.lastTime;
    const after = (arg.after as number) || 0;

    const filtered = [];
    for (const event of this.list) {
      if (type === 'all' || event.type === type) {
        if (event.time >= after && event.time <= before) {
          filtered.push(event);
        }
      }
    }
    return filtered;
  }

  /** @deprecated */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  find(a: any) {
    return this.list.find(a);
  }

  /** @deprecated */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findIndex(a: any) {
    return this.list.findIndex(a);
  }
}

class Blocks {
  blocks: Record<string, number>;

  constructor() {
    this.blocks = {};
  }

  push(block: string) {
    if (!this.blocks[block]) {
      this.blocks[block] = 0;
    }
    this.blocks[block]++;
  }

  containsLoop() {
    return containsLoop(this.blocks);
  }

  containsBlock(blockName: string) {
    return containsBlock(blockName, this.blocks);
  }

  numberOfExecutions(blockName: string) {
    return countExecutions(blockName, this.blocks);
  }
}

// TODO: review
export class Log {
  frames: LogFrame[];
  events: Events;
  renderer: LogRenderer;
  blocks: Blocks;

  constructor() {
    /** @type LogFrame[] */
    this.frames = [];
    this.events = new Events();
    this.renderer = new LogRenderer();
    this.blocks = new Blocks();
  }

  /**
   * Get the first saved frame.
   *
   * @return {LogFrame|undefined}
   */
  get initial(): LogFrame | undefined {
    return first(this.frames);
  }

  /**
   * Get the current frame, i.e. the last saved frame.
   */
  get current(): LogFrame | undefined {
    return last(this.frames);
  }

  /**
   * Add a frame.
   */
  addFrame(context: Context, block: string): void {
    const frame = new LogFrame(context, block);
    this.frames.push(frame);
    this.blocks.push(block);
  }

  addEvent(event: LogEvent): void {
    this.events.push(event);
  }

  /**
   * @deprecated
   */
  reset(): void {
    // not needed
  }

  /**
   * @return {LogFrame} return final state of sprites
   */
  get sprites(): LogFrame {
    return this.frames[this.frames.length - 1];
  }

  // Functions needed for evaluation

  // Sprite related
  getCostumes(spriteName: string, frames = this.frames): Record<string, string> {
    const costumes: Record<string, string> = {};
    const costumeIds = new Set();
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (!costumeIds.has(sprite.currentCostume)) {
          costumeIds.add(sprite.currentCostume);
          costumes[sprite.currentCostume] = sprite.costume;
        }
      }
    }
    return costumes;
  }

  getNumberOfCostumes(spriteName: string): number {
    const costumes = this.getCostumes(spriteName);
    return Object.keys(costumes).length;
  }

  getVariableValue(
    variableName: string,
    spriteName = 'Stage',
    frame = this.sprites,
  ): unknown {
    for (const sprite of frame.sprites) {
      if (sprite.name === spriteName) {
        for (const variable of sprite.variables) {
          if (variable.name === variableName) {
            return variable.value;
          }
        }
      }
    }
  }

  getVariables(
    variableName: string,
    spriteName = 'Stage',
    frames = this.frames,
  ): unknown[] {
    return frames
      .map((frame) => frame.getSprite(spriteName))
      .map((sprite) => ensure(sprite).getVariable(variableName))
      .map((variable) => ensure(variable).value)
      .filter((item, pos, arr) => {
        return pos === 0 || !isEqual(item, arr[pos - 1]);
      });
  }

  getStartSprites(): LoggedSprite[] {
    return this.frames[0].sprites;
  }

  getMaxX(spriteName: string, frames = this.frames): number {
    let max = -240;
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (sprite.x > max) {
          max = sprite.x;
        }
      }
    }
    return max;
  }

  getMinX(spriteName: string, frames = this.frames): number {
    let min = 240;
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (sprite.x < min) {
          min = sprite.x;
        }
      }
    }
    return min;
  }

  getMaxY(spriteName: string, frames = this.frames): number {
    let max = -180;
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (sprite.y > max) {
          max = sprite.y;
        }
      }
    }
    return max;
  }

  getMinY(spriteName: string, frames = this.frames): number {
    let min = 180;
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (sprite.y < min) {
          min = sprite.y;
        }
      }
    }
    return min;
  }

  hasSpriteMoved(spriteName: string, frames = this.frames): boolean {
    if (frames.length === 0) return false;
    const minX = this.getMinX(spriteName, frames);
    const maxX = this.getMaxX(spriteName, frames);
    const minY = this.getMinY(spriteName, frames);
    const maxY = this.getMaxY(spriteName, frames);
    return !(minX === maxX && minY === maxY);
  }

  inBounds(spriteName: string, frames = this.frames): boolean {
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (sprite.isTouchingEdge) {
          return false;
        }
      }
    }
    return true;
  }

  getDirectionChanges(spriteName: string, frames = this.frames): number[] {
    const directions = [];
    let oldDirection = 0;
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (oldDirection !== sprite.direction) {
          directions.push(sprite.direction);
          oldDirection = sprite.direction;
        }
      }
    }
    return directions;
  }

  getCostumeChanges(spriteName: string, frames = this.frames): string[] {
    const costumes = [];
    let oldCostume = '';
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      if (sprite != null) {
        if (oldCostume !== sprite.costume) {
          costumes.push(sprite.costume);
          oldCostume = sprite.costume;
        }
      }
    }
    return costumes;
  }

  /**
   * @deprecated
   */
  isTouchingSprite(spriteName: string, targetName: string, frame: LogFrame): boolean {
    return frame.isTouching(spriteName, targetName);
  }

  getDistancesToSprite(
    spriteName: string,
    targetName: string,
    frames = this.frames,
  ): number[] {
    const distances = [];
    for (const frame of frames) {
      const sprite = frame.getSprite(spriteName);
      const target = frame.getSprite(targetName);
      if (sprite != null && target != null) {
        distances.push(Math.sqrt(distSq(sprite, target)));
      }
    }
    return distances;
  }

  doSpritesOverlap(
    spriteName1: string,
    spriteName2: string,
    frame = this.sprites,
  ): boolean {
    const sprite1 = frame.getSpriteOr(spriteName1);
    const sprite2 = frame.getSpriteOr(spriteName2);
    const bounds1 = sprite1.bounds!;
    const bounds2 = sprite2.bounds!;
    // If one rectangle is on left side of other
    if (bounds1.left > bounds2.right || bounds1.right < bounds2.left) {
      return false;
    }
    // If one rectangle is above other
    return !(bounds1.top < bounds2.bottom || bounds1.bottom > bounds2.top);
  }

  /**
   * Get all logged locations of a sprite.
   *
   * The locations are consecutively unique: if a sprite hasn't moved between
   * two logged frames, only one position will be included.
   *
   * @param {string} sprite - The name of the sprite.
   * @param {LogFrame[]} frames - The frames to search. Defaults to all frames.
   * @return {Array<{x:Number, y:Number}>} The positions.
   */
  getSpritePositions(sprite: string, frames = this.frames): Position[] {
    return frames
      .map((frame) => frame.getSpriteOr(sprite))
      .map((sprite) => {
        return { x: sprite.x, y: sprite.y };
      })
      .filter((item, pos, arr) => {
        return pos === 0 || !isEqual(item, arr[pos - 1]);
      });
  }

  getSprites(
    sprite: string,
    frames = this.frames,
    mapper = (s: LoggedSprite) => s,
  ): LoggedSprite[] {
    const sprites = frames.map((frame) => frame.getSpriteOr(sprite)).map(mapper);
    return uniq(sprites);
  }

  /** @deprecated Use getSpritePositions */
  getSpriteLocations(spriteName: string, frames = this.frames): Position[] {
    return this.getSpritePositions(spriteName, frames);
  }

  // RENDERER RELATED

  getSquares(): false | { points: Position[]; length: number }[] {
    return findSquares(this.renderer.lines);
  }

  getTriangles(): boolean | Position[][] {
    return findTriangles(this.renderer.lines);
  }

  getMergedLines(): Line[] {
    return mergeLines(this.renderer.lines);
  }

  getLineLength(line: Line): number {
    return dist(line);
  }

  getResponses(): unknown[] {
    return this.renderer.responses;
  }

  getCreateSkinEvents(): LogEvent[] {
    const rendererEvents = this.events.filter({ type: 'renderer' });
    const createTextSkinEvents = [];
    for (const event of rendererEvents) {
      if (event.data.name === 'createTextSkin') {
        createTextSkinEvents.push(event);
      }
    }
    return createTextSkinEvents;
  }

  getDestroySkinEvents(): LogEvent[] {
    const rendererEvents = this.events.filter({ type: 'renderer' });
    const destroySkinEvents = [];
    for (const event of rendererEvents) {
      if (event.data.name === 'destroySkin') {
        destroySkinEvents.push(event);
      }
    }
    return destroySkinEvents;
  }

  getSkinDuration(text: string): number | null {
    const createTextSkinEvents = this.getCreateSkinEvents();
    const destroyTextSkinEvents = this.getDestroySkinEvents();

    let time = 0;
    let id = -1;
    for (const e of createTextSkinEvents) {
      if (e.data.text === text) {
        time = e.time;
        id = e.data.id as number;
      }
    }
    for (const e of destroyTextSkinEvents) {
      if (e.data.id === id) {
        return e.time - time;
      }
    }
    return null;
  }
}
