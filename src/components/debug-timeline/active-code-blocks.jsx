import React from 'react';
import PropTypes from 'prop-types';
import styles from './active-code-blocks.css';

/**
 * Convert a Scratch opcode into a short label suitable for a child-friendly code list.
 * @param {string} opcode The Scratch block opcode.
 * @return {string} A readable block label.
 */
const formatOpcode = opcode => opcode
    .replace(/^event_/, '')
    .replace(/^control_/, '')
    .replace(/^looks_/, '')
    .replace(/^motion_/, '')
    .replace(/^sound_/, '')
    .replace(/^sensing_/, '')
    .replace(/^data_/, '')
    .replace(/^operator_/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

/**
 * Map a Scratch opcode to the palette category used by Scratch blocks.
 * @param {string} opcode The Scratch block opcode.
 * @return {string} The block palette category.
 */
const getBlockCategory = opcode => {
    if (opcode.startsWith('event_')) return 'event';
    if (opcode.startsWith('motion_')) return 'motion';
    if (opcode.startsWith('looks_')) return 'looks';
    if (opcode.startsWith('sound_') || opcode.startsWith('music_')) return 'sounds';
    if (opcode.startsWith('control_')) return 'control';
    if (opcode.startsWith('sensing_') || opcode.startsWith('video_')) return 'sensing';
    if (opcode.startsWith('pen_')) return 'pen';
    if (opcode.startsWith('operator_')) return 'operators';
    if (opcode.startsWith('data_')) return 'data';
    return 'more';
};

/**
 * Extract a nested script block ID from a serialized block input.
 * @param {Array|*} input A serialized Scratch block input.
 * @param {object} targetBlocks The selected target's block map.
 * @return {?string} The nested script's first block ID.
 */
const getSubstackId = (input, targetBlocks) => {
    if (!Array.isArray(input)) {
        return null;
    }

    return input
        .slice(1)
        .find(value => typeof value === 'string' && targetBlocks[value]) || null;
};

/**
 * Flatten a Scratch script, including nested control block substacks.
 * @param {?string} blockId The first block ID to visit.
 * @param {object} targetBlocks The selected target's block map.
 * @param {Set<string>} visited Block IDs already added to the script.
 * @return {Array<string>} Block IDs in display order.
 */
const getScriptBlockIds = (blockId, targetBlocks, visited = new Set()) => {
    if (!blockId || visited.has(blockId) || !targetBlocks[blockId]) {
        return [];
    }

    visited.add(blockId);
    const block = targetBlocks[blockId];
    const blockIds = [blockId];

    Object.keys(block.inputs || {})
        .filter(inputName => inputName.startsWith('SUBSTACK'))
        .forEach(inputName => {
            const substackId = getSubstackId(block.inputs[inputName], targetBlocks);
            blockIds.push(...getScriptBlockIds(substackId, targetBlocks, visited));
        });

    blockIds.push(...getScriptBlockIds(block.next, targetBlocks, visited));
    return blockIds;
};

/**
 * Find active thread code for the selected debugger snapshot.
 * @param {object|null} context The debugger context containing recorded snapshots.
 * @param {number} timeFrame The selected snapshot index.
 * @param {string} editingTarget The target whose code is being inspected.
 * @param {object} targetBlocks The selected target's block map.
 * @return {Array<object>} Active threads with their full scripts and highlighted block ID.
 */
export const getActiveCodeThreads = (context, timeFrame, editingTarget, targetBlocks) => {
    const snapshot = context && context.log && context.log.snapshots &&
        context.log.snapshots[timeFrame];
    if (!snapshot || !snapshot.runtimeSnapshot) {
        return [];
    }

    return (snapshot.runtimeSnapshot.threads || [])
        .map(thread => {
            try {
                return JSON.parse(thread);
            } catch (error) {
                return null;
            }
        })
        .filter(thread => thread && thread.targetId === editingTarget)
        .map(thread => {
            const highlightedBlock = thread.stack && thread.stack.length > 0 ?
                thread.stack[thread.stack.length - 1] : null;
            const scriptBlockIds = getScriptBlockIds(thread.topBlock, targetBlocks);

            return {
                id: thread.topBlock,
                highlightedBlock,
                blocks: scriptBlockIds
                    .map(blockId => ({
                        id: blockId,
                        opcode: targetBlocks[blockId] && targetBlocks[blockId].opcode,
                        category: targetBlocks[blockId] && targetBlocks[blockId].opcode ?
                            getBlockCategory(targetBlocks[blockId].opcode) : 'more'
                    }))
                    .filter(block => block.opcode)
            };
        })
        .filter(thread => thread.blocks.length > 0);
};

/**
 * Render the active Scratch threads as a compact, read-only code view.
 * @param {object|null} context The debugger context containing recorded snapshots.
 * @param {number} timeFrame The selected snapshot index.
 * @param {string} editingTarget The selected target ID.
 * @param {object} targetBlocks The selected target's block map.
 * @return {JSX.Element} The active code panel.
 */
const ActiveCodeBlocks = ({context, timeFrame, editingTarget, targetBlocks}) => {
    const threads = getActiveCodeThreads(context, timeFrame, editingTarget, targetBlocks);

    return (
        <section
            className={styles.panel}
            aria-label={'Active code blocks'}
        >
            <h2 className={styles.title}>{'Active code'}</h2>
            {threads.length === 0 ? (
                <p className={styles.empty}>{'No code is running at this frame.'}</p>
            ) : (
                <div className={styles.threadList}>
                    {threads.map(thread => (
                        <div
                            className={styles.thread}
                            key={thread.id}
                        >
                            {thread.blocks.map(block => (
                                <div
                                    className={`${styles.block} ${styles[block.category]} ${
                                        block.id === thread.highlightedBlock ? styles.active : ''
                                    }`}
                                    key={block.id}
                                >
                                    {formatOpcode(block.opcode)}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

ActiveCodeBlocks.propTypes = {
    context: PropTypes.shape({
        log: PropTypes.shape({
            snapshots: PropTypes.arrayOf(PropTypes.object).isRequired
        }).isRequired
    }),
    timeFrame: PropTypes.number.isRequired,
    editingTarget: PropTypes.string,
    targetBlocks: PropTypes.shape({}).isRequired
};

export default ActiveCodeBlocks;
