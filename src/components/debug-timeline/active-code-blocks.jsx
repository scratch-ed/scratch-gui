import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
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
 * Build a script tree from the VM's block map, preserving control substacks.
 * @param {?string} blockId The first block ID to visit.
 * @param {object} targetBlocks The selected target's block map.
 * @param {Set<string>} visited Block IDs already added to the script.
 * @return {Array<object>} Blocks in execution order with nested branches.
 */
const getScriptBlocks = (blockId, targetBlocks, visited = new Set()) => {
    const blocks = [];
    // Traverse the script starting from the given block ID, adding blocks to the list while preserving control flow.
    while (blockId && !visited.has(blockId) && targetBlocks[blockId]) {
        visited.add(blockId);
        const block = targetBlocks[blockId];
        const inputs = block.inputs || {};
        // Identify the names of input branches that represent control substacks.
        const branchNames = Object.keys(inputs)
            .filter(name => /^SUBSTACK\d*$/.test(name));
        if (block.opcode === 'control_if_else') {
            ['SUBSTACK', 'SUBSTACK2'].forEach(name => {
                if (!branchNames.includes(name)) branchNames.push(name);
            });
        }
        // Sort the branch names to ensure SUBSTACK comes before SUBSTACK2, etc.
        branchNames.sort((first, second) => {
            const branchNumber = name => Number(name.slice('SUBSTACK'.length)) || 1;
            return branchNumber(first) - branchNumber(second);
        });

        blocks.push({
            id: blockId,
            opcode: block.opcode,
            category: getBlockCategory(block.opcode),
            branches: branchNames.map(name => ({
                name,
                blocks: getScriptBlocks(inputs[name] && inputs[name].block, targetBlocks, visited)
            }))
        });
        blockId = block.next;
    }
    return blocks;
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
            return {
                id: thread.topBlock,
                highlightedBlock,
                blocks: getScriptBlocks(thread.topBlock, targetBlocks)
            };
        })
        .filter(thread => thread.blocks.length > 0);
};

/**
 * Render a script's blocks and recursively indented control branches.
 * @param {object} props The blocks and current highlighted block ID.
 * @return {JSX.Element} The script's block list.
 */
const ScriptBlocks = ({blocks, highlightedBlock, highlightedRef}) => (
    <div className={styles.scriptBlocks}>
        {blocks.map(block => (
            <div key={block.id}>
                <div
                    className={`${styles.block} ${styles[block.category]} ${
                        block.id === highlightedBlock ? styles.active : ''
                    }`}
                    ref={block.id === highlightedBlock ? highlightedRef : null}
                >
                    {formatOpcode(block.opcode)}
                </div>
                {block.branches.map(branch => (
                    <div
                        className={styles.branch}
                        key={branch.name}
                    >
                        {block.opcode === 'control_if_else' && (
                            <span className={styles.branchLabel}>
                                {branch.name === 'SUBSTACK' ? (
                                    <FormattedMessage
                                        defaultMessage="Then"
                                        description="First branch of an if-else block"
                                        id="gui.activeCode.then"
                                    />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Else"
                                        description="Second branch of an if-else block"
                                        id="gui.activeCode.else"
                                    />
                                )}
                            </span>
                        )}
                        <ScriptBlocks
                            blocks={branch.blocks}
                            highlightedBlock={highlightedBlock}
                            highlightedRef={highlightedRef}
                        />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

ScriptBlocks.propTypes = {
    blocks: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        opcode: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        branches: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            blocks: PropTypes.arrayOf(PropTypes.shape({})).isRequired
        })).isRequired
    })).isRequired,
    highlightedBlock: PropTypes.string,
    highlightedRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired
};

/**
 * Keep each thread's highlighted block visible without scrolling the surrounding timeline.
 * @param {object} props The thread, selected frame and panel size.
 * @return {JSX.Element} The independently scrollable thread.
 */
const ActiveThread = ({thread, timeFrame, editingTarget, targetBlocks, panelSize}) => {
    const threadRef = useRef(null);
    const highlightedRef = useRef(null);

    useLayoutEffect(() => {
        const container = threadRef.current;
        const keepHighlightedVisible = () => {
            const block = highlightedRef.current;
            if (!container || !block) return;

            const containerRect = container.getBoundingClientRect();
            const blockRect = block.getBoundingClientRect();
            const top = containerRect.top + container.clientTop;
            const left = containerRect.left + container.clientLeft;
            const bottom = top + container.clientHeight;
            const right = left + container.clientWidth;
            if (blockRect.top < top) {
                container.scrollTop += blockRect.top - top;
            } else if (blockRect.bottom > bottom) {
                container.scrollTop += blockRect.bottom - bottom;
            }
            if (blockRect.left < left) {
                container.scrollLeft += blockRect.left - left;
            } else if (blockRect.right > right) {
                container.scrollLeft += blockRect.right - right;
            }
        };

        keepHighlightedVisible();
        if (typeof ResizeObserver !== 'undefined' && container) {
            const observer = new ResizeObserver(keepHighlightedVisible);
            observer.observe(container);
            return () => observer.disconnect();
        }
        return () => {};
    }, [thread.highlightedBlock, timeFrame, editingTarget, targetBlocks, panelSize]);

    return (
        <div
            className={styles.thread}
            ref={threadRef}
        >
            <ScriptBlocks
                blocks={thread.blocks}
                highlightedBlock={thread.highlightedBlock}
                highlightedRef={highlightedRef}
            />
        </div>
    );
};

ActiveThread.propTypes = {
    thread: PropTypes.shape({
        blocks: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
        highlightedBlock: PropTypes.string
    }).isRequired,
    timeFrame: PropTypes.number.isRequired,
    editingTarget: PropTypes.string,
    targetBlocks: PropTypes.shape({}).isRequired,
    panelSize: PropTypes.number.isRequired
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
    const [panelSize, setPanelSize] = useState(40);

    /**
     * Set the panel height as a percentage of the timeline area.
     * @param {Event} event The resize slider change event.
     * @returns {void}
     */
    const handlePanelSizeChange = useCallback(event => {
        setPanelSize(Number(event.target.value));
    }, []);

    return (
        <section
            className={styles.panel}
            aria-label={'Active code blocks'}
            style={{height: `${panelSize}%`}}
        >
            <div className={styles.header}>
                <h2 className={styles.title}>{'Active code'}</h2>
                <label className={styles.resizeLabel}>
                    <FormattedMessage
                        defaultMessage="Panel size"
                        description="Label for the active code panel size slider"
                        id="gui.activeCode.panelSize"
                    />
                    <input
                        className={styles.resizeInput}
                        type="range"
                        min="20"
                        max="70"
                        step="5"
                        value={panelSize}
                        onChange={handlePanelSizeChange}
                    />
                </label>
            </div>
            {threads.length === 0 ? (
                <p className={styles.empty}>{'No code is running at this frame.'}</p>
            ) : (
                <div className={styles.threadList}>
                    {threads.map(thread => (
                        <ActiveThread
                            key={thread.id}
                            thread={thread}
                            timeFrame={timeFrame}
                            editingTarget={editingTarget}
                            targetBlocks={targetBlocks}
                            panelSize={panelSize}
                        />
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
