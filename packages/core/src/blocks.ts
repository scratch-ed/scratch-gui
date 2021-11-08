/* eslint-disable @typescript-eslint/no-use-before-define */
/* Copyright (C) 2019 Ghent University - All Rights Reserved */
import isNumber from 'lodash-es/isNumber';
import { Sb3Block, Sb3Mutation, Sb3Target } from './structures';
import { ensure } from './utils';

/**
 * @deprecated
 */
export function containsLoop(blocks: Record<string, unknown>): boolean {
  for (const key in blocks) {
    if (key === 'control_repeat' || key === 'control_forever') return true;
  }
  return false;
}

/**
 * @deprecated
 */
export function containsBlock(name: string, blocks: Record<string, unknown>): boolean {
  for (const key in blocks) {
    if (key === name) return true;
  }
  return false;
}

/**
 * @deprecated
 */
export function countExecutions(name: string, blocks: Record<string, number>): number {
  for (const key in blocks) {
    if (key === name) {
      return blocks[key];
    }
  }
  return 0;
}

// eslint-disable-next-line no-use-before-define
function getOrNull(blockId: string | null, blockmap: Map<string, Sb3Block>): Node | null {
  if (blockId) {
    const parentBlock = ensure(blockmap.get(blockId));
    return blockToNode(parentBlock, blockmap);
  } else {
    return null;
  }
}

function convertInput(inputArray: unknown[], blockmap: Map<string, Sb3Block>) {
  // We ignore shadows, as they are not that relevant for us.
  // As such, we always convert the second element in the input array.
  if (Array.isArray(inputArray[1])) {
    const input = inputArray[1];
    return input[1];
  } else {
    // ID of a block.
    const id = inputArray[1];
    const block = blockmap.get(<string>id);
    if (!block) {
      return undefined;
    } else {
      return blockToNode(block, blockmap);
    }
  }
}

function convertMutation(mutation: Sb3Mutation | null): string | null {
  if (!mutation) {
    return null;
  }

  return mutation.proccode;
}

export interface Node {
  opcode: string;
  next: Node | null;
  input: Record<string, unknown>;
  fields: Record<string, unknown>;
  mutation: string | null;
}

function convertFields(
  fields: Record<string, unknown[]> | null,
): Record<string, unknown> {
  const object: Record<string, unknown> = {};
  if (!fields) {
    return object;
  }
  for (const [name, description] of Object.entries(fields)) {
    object[name] = description[0];
  }
  return object;
}

/**
 * Convert one block to a tree node.
 */
function blockToNode(block: Sb3Block, blockmap: Map<string, Sb3Block>): Node {
  const next = getOrNull(block.next, blockmap);

  const input: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(block.inputs || {})) {
    const converted = convertInput(value, blockmap);
    if (value[0] === 1 && !converted) {
      continue;
    }
    input[key] = converted;
    if (isNumber(input[key])) {
      input[key] = (<number>input[key]).toString();
    }
  }

  return {
    opcode: block.opcode,
    next: next,
    input: input,
    fields: convertFields(block.fields),
    mutation: convertMutation(block.mutation),
  };
}

/**
 * Convert all blocks from a sprite to a list of trees, where each tree is
 * a set of attached blocks.
 *
 * @param sprite
 * @param blocks - Top level blocks to filter.
 */
export function asTree(
  sprite: Sb3Target,
  blocks: Sb3Block[] = sprite.blocks.filter((b) => b.topLevel),
): Set<Node> {
  const blockMap = new Map(sprite.blocks.map((i) => [i.id, i]));

  // Find all top-level blocks.
  const filtered = blocks.filter((b) => b.topLevel).map((b) => blockToNode(b, blockMap));

  return new Set(filtered);
}
