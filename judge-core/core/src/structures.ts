import isEqual from 'lodash-es/isEqual';
import { asTree, Node } from './blocks';

export class Sb3Variable {
  name: string;
  value: unknown;
  id: string;

  constructor(id: string, data: Array<unknown>) {
    this.name = data[0] as string;
    this.value = data[1];
    this.id = id;
  }
}

export interface Sb3Mutation {
  tagName: string;
  children: Array<unknown>;
  proccode: string;
  argumentids: string;
}

export interface Sb3List {
  name: string;
  list: Array<unknown>;
}

export class Sb3Block {
  id: string;
  /**
   * A string naming the block. The opcode of a "core" block may be found in the
   * Scratch source code here or here for shadows, and the opcode of an extension's
   * block may be found in the extension's source code.
   */
  opcode: string;
  /**
   * The ID of the following block or `null`.
   */
  next: string | null;
  /**
   * If the block is a stack block and is preceded, this is the ID of the preceding
   * block. If the block is the first stack block in a C mouth, this is the ID of
   * the C block. If the block is an input to another block, this is the ID of
   * that other block. Otherwise it is null.
   */
  parent: string | null;
  /**
   * An object associating names with arrays representing inputs into which
   * reporters may be dropped and C mouths. The first element of each array
   * is 1 if the input is a shadow, 2 if there is no shadow, and 3 if there
   * is a shadow but it is obscured by the input. The second is either the
   * ID of the input or an array representing it as described below. If
   * there is an obscured shadow, the third element is its ID or an array
   * representing it.
   */
  inputs: Record<string, Array<unknown>>;
  /**
   * An object associating names with arrays representing fields. The first
   * element of each array is the field's value which may be followed by an ID.
   */
  fields: Record<string, Array<unknown>>;
  /**
   * True if this is a shadow and false otherwise.
   *
   * A shadow is a constant expression in a block input which can be replaced
   * by a reporter; Scratch internally considers these to be blocks although they
   * are not usually thought of as such.
   *
   * This means that a shadow is basically the place holder of some variable in blocks
   * while they are in the toolbox.
   *
   * @see https://groups.google.com/g/blockly/c/bXe4iEaVSao
   */
  shadow: boolean;
  /**
   * False if the block has a parent and true otherwise.
   */
  topLevel: boolean;
  /**
   * ID of the comment if the block has a comment.
   */
  comment: string | null;
  /**
   * X coordinate in the code area if top-level.
   */
  x: number | null;
  /**
   * Y coordinate in the code area if top-level.
   */
  y: number | null;
  /**
   * Mutation data if a mutation.
   */
  mutation: Sb3Mutation | null;

  constructor(id: string, data: Record<string, unknown>) {
    this.id = id;
    this.opcode = data.opcode as string;
    this.next = data.next as string;
    this.parent = data.parent as string;
    this.inputs = data.inputs as Record<string, Array<unknown>>;
    this.fields = data.fields as Record<string, Array<unknown>>;
    this.shadow = data.shadow as boolean;
    this.topLevel = data.topLevel as boolean;
    this.comment = data.comment as string;
    this.x = data.x as number;
    this.y = data.y as number;
    this.mutation = data.mutation as Sb3Mutation | null;
  }

  /**
   * Get the procedure name of the procedure being called.
   * If the block is not a procedure call, an error will be thrown.
   */
  get calledProcedureName(): string {
    if (this.opcode !== 'procedures_call') {
      throw new Error('Cannot get called procedure name from non procedure call.');
    }

    return this.mutation!.proccode;
  }

  toString(): string {
    return `Block ${this.id} (${this.opcode})`;
  }
}

/**
 * @see https://en.scratch-wiki.info/wiki/Scratch_File_Format#Comments
 */
interface Sb3Comment {
  blockId: string;
  x: number;
  y: number;
  height: number;
  width: number;
  minimized: boolean;
  text: string;
}

/**
 * @see https://en.scratch-wiki.info/wiki/Scratch_File_Format#Assets
 */
interface Sb3Asset {
  assetId: string;
  name: string;
  md5ext: string;
  dataFormat: string;
}

/**
 * @see https://en.scratch-wiki.info/wiki/Scratch_File_Format#Costumes
 */
interface Sb3Costume extends Sb3Asset {
  bitmapResolution: number | null;
  rotationCenterX: number;
  rotationCenterY: number;
}

/**
 * @see https://en.scratch-wiki.info/wiki/Scratch_File_Format#Sounds
 */
interface Sb3Sound extends Sb3Asset {
  rate: number;
  sampleCount: number;
}

interface Sb3Monitor {
  id: string;
  mode: 'default' | 'large' | 'slider' | 'list';
  opcode: string;
  params: Record<string, unknown>;
  spriteName: string | null;
  value: unknown;
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
}

/**
 * The base sprite class, used in the sb3 format.
 *
 * @see https://en.scratch-wiki.info/wiki/Scratch_File_Format#Targets
 */
export class Sb3Target {
  /**
   * True if this is the stage and false otherwise.
   */
  isStage: boolean;
  name: string;
  /**
   * An object associating IDs with arrays representing variables whose
   * first element is the variable's name followed by it's value.
   */
  variables: Record<string, Sb3Variable>;
  /**
   * An object associating IDs with arrays representing lists whose first
   * element is the list's name followed by the list as an array.
   */
  lists: Record<string, Sb3List>;
  /**
   * An object associating IDs with broadcast names.
   */
  broadcasts: Record<string, string>;
  /**
   * An object associating IDs with blocks.
   */
  blocks: Array<Sb3Block>;
  /**
   * An object associating IDs with comments.
   */
  comments: Record<string, Sb3Comment>;
  /**
   * The costume number.
   */
  currentCostume: number;
  /**
   * An array of costumes.
   */
  costumes: Array<Sb3Costume>;
  /**
   * An array of sounds.
   */
  sounds: Array<Sb3Sound>;
  volume: number;
  layerOrder: number;

  /**
   * @param {Object} data - Original data from the project.json
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any>) {
    this.isStage = data.isStage;
    this.name = data.name;
    this.variables = {};
    for (const variable of Object.keys(data.variables || {})) {
      this.variables[variable] = new Sb3Variable(variable, data.variables[variable]);
    }
    this.lists = data.lists || {};
    this.broadcasts = data.broadcasts || {};
    this.blocks = [];
    for (const [key, value] of Object.entries(data.blocks || {})) {
      this.blocks.push(new Sb3Block(key, value as Record<string, unknown>));
    }
    this.comments = data.comments || {};
    this.currentCostume = data.currentCostume;
    this.costumes = data.costumes;
    this.sounds = data.sounds;
    this.volume = data.volume;
    this.layerOrder = data.layerOrder;
  }

  /**
   * Check if this target is equal to another target.
   */
  equals(other: Sb3Target): boolean {
    return isEqual(this, other);
  }

  /**
   * Check if this sprite contains a block with the given opcode.
   *
   * @param {string} opcode
   * @return {boolean}
   */
  hasBlock(opcode: string): boolean {
    return this.blocks.some((block) => block.opcode === opcode);
  }

  /**
   * Get the first block with opcode.
   *
   * @param {string} opcode
   * @return {null|Sb3Block}
   */
  getFirst(opcode: string): Sb3Block | null {
    return this.blocks.find((block) => block.id === opcode) || null;
  }

  /**
   * Get an object that can be used to compare against other sprites
   * from a similar project, e.g. to compare if the user changed something.
   *
   * @return {{isStage, name: string}}
   */
  comparableObject(): { isStage: boolean; name: string } {
    return {
      isStage: this.isStage,
      name: this.name,
    };
  }

  /**
   * Get all blocks as a set of trees.
   * You can optionally pass a list of tree roots to consider; other blocks
   * will be ignored.
   */
  blockTree(blocks: Array<Sb3Block> | undefined = undefined): Set<Node> {
    return asTree(this, blocks);
  }
}

export class Sb3Stage extends Sb3Target {
  tempo: number;
  videoTransparency: number;
  videoState: 'on' | 'on-flipped' | 'off';
  textToSpeechLanguage: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any>) {
    super(data);
    this.tempo = data.temppo;
    this.videoTransparency = data.videoTransparency;
    this.videoState = data.videoState;
    this.textToSpeechLanguage = data.textToSpeechLanguage;
  }
}

export class Sb3Sprite extends Sb3Target {
  visible: boolean;
  x: number;
  y: number;
  size: number;
  direction: number;
  draggable: boolean;
  rotationStyle: 'all around' | 'left-right' | "don't rotate";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any>) {
    super(data);
    this.visible = data.visible;
    this.x = data.x;
    this.y = data.y;
    this.size = data.size;
    this.direction = data.direction;
    this.draggable = data.draggable;
    this.rotationStyle = data.rotationStyle;
  }
}

export class Sb3Json {
  targets: Array<Sb3Target>;
  monitors: Array<Sb3Monitor>;
  extensions: Array<unknown>;
  meta: Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.targets = data.targets.map((t: Record<string, any>) =>
      t.isStage ? new Sb3Stage(t) : new Sb3Sprite(t),
    );
    this.monitors = data.monitors;
    this.extensions = data.extensions;
    this.meta = data.meta;
  }
}
