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
 * Find active thread code for the selected debugger snapshot.
 * @param {object|null} context The debugger context containing recorded snapshots.
 * @param {number} timeFrame The selected snapshot index.
 * @param {string} editingTarget The target whose code is being inspected.
 * @param {object} targetBlocks The selected target's block map.
 * @return {Array<object>} Active threads with their blocks and highlighted block ID.
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
        .map(thread => ({
            id: thread.topBlock,
            highlightedBlock: thread.blockGlowInFrame,
            blocks: (thread.stack || [])
                .map(blockId => ({
                    id: blockId,
                    opcode: targetBlocks[blockId] && targetBlocks[blockId].opcode
                }))
                .filter(block => block.opcode)
        }))
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
                                    className={`${styles.block} ${
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
