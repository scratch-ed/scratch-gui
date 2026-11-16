import React, {useCallback, useLayoutEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape, IntlProvider} from 'react-intl';
import focusIcon from '../timeline/targeting.png';
import {getBlockLabels, getSnapshotReporterValue} from './active-code-labels';
import {renderNativeScript} from './native-script';
import {EVENT_INFO} from './constants.ts';
import Icon from './icon.jsx';
import log from '../../lib/log';
import {getColorsForTheme} from '../../lib/themes';
import styles from './active-code-blocks.css';

const messages = defineMessages({
    focus: {
        defaultMessage: 'Focus on highlighted blocks',
        description: 'Tooltip for the button that shows highlighted blocks in all active threads',
        id: 'gui.activeCode.focus'
    },
    script: {
        defaultMessage: 'Scratch script: {starter}. Current block: {block}',
        description: 'Accessible description of a script starter and its current block',
        id: 'gui.activeCode.script'
    },
    unknownBlock: {
        defaultMessage: 'none',
        description: 'Description when no current block is available',
        id: 'gui.activeCode.noCurrentBlock'
    },
    panel: {
        defaultMessage: 'Active code blocks',
        description: 'Accessible name for the active code panel',
        id: 'gui.activeCode.panel'
    }
});

const localMessages = {
    nl: {
        'gui.activeCode.focus': 'Focus op gemarkeerde blokken',
        'gui.activeCode.script': 'Scratch-script: {starter}. Huidig blok: {block}',
        'gui.activeCode.noCurrentBlock': 'geen',
        'gui.activeCode.panel': 'Actieve codeblokken',
        'gui.activeCode.title': 'Actieve code',
        'gui.activeCode.panelSize': 'Paneelgrootte',
        'gui.activeCode.frameValues': 'Waarden in dit frame',
        'gui.activeCode.empty': 'Er wordt geen code uitgevoerd in dit frame.',
        'gui.activeCode.then': 'Dan',
        'gui.activeCode.else': 'Anders',
        'gui.activeCode.unsupportedBlock': 'Niet-ondersteund blok: {opcode}',
        'gui.activeCode.snapshotValue': '({value})',
        'gui.activeCode.renderWarning': 'Scratch-blokken kunnen niet worden weergegeven; ' +
            'een vereenvoudigd script wordt getoond.'
    }
};

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
const ScriptBlocks = ({blocks, highlightedBlock, highlightedRef, labels, targetBlocks, snapshot, editingTarget}) => (
    <div className={styles.scriptBlocks}>
        {blocks.map(block => (
            <div key={block.id}>
                <div
                    className={`${styles.block} ${styles[block.category]} ${
                        block.id === highlightedBlock ? styles.active : ''
                    }`}
                    ref={block.id === highlightedBlock ? highlightedRef : null}
                >
                    <BlockLabel
                        label={labels[block.id]}
                        targetBlocks={targetBlocks}
                        snapshot={snapshot}
                        editingTarget={editingTarget}
                        highlightedBlock={highlightedBlock}
                        highlightedRef={highlightedRef}
                    />
                    <FrameValue value={getSnapshotReporterValue(targetBlocks[block.id], snapshot, editingTarget)} />
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
                            labels={labels}
                            targetBlocks={targetBlocks}
                            snapshot={snapshot}
                            editingTarget={editingTarget}
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
    highlightedRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired,
    labels: PropTypes.shape({}).isRequired,
    targetBlocks: PropTypes.shape({}).isRequired,
    snapshot: PropTypes.shape({}),
    editingTarget: PropTypes.string
};

/**
 * Render localized block fields and recursively nested reporter inputs.
 * @param {object} props The label parts and selected-frame context.
 * @return {JSX.Element} The read-only block label.
 */
const BlockLabel = ({label, targetBlocks, snapshot, editingTarget, highlightedBlock, highlightedRef}) => {
    if (!label) return <span>{'?'}</span>;
    if (label.unsupported) {
        return (
            <FormattedMessage
                defaultMessage="Unsupported block: {opcode}"
                description="Label for a block whose text is unavailable"
                id="gui.activeCode.unsupportedBlock"
                values={{opcode: label.parts[0].text}}
            />
        );
    }
    return (
        <span>
            {label.parts.map((part, index) => {
                let content;
                if (part.type === 'icon') {
                    content = (
                        <img
                            className={styles.blockIcon}
                            src={part.src}
                            alt={part.alt}
                        />
                    );
                } else if (part.type === 'keyIcon') {
                    content = (
                        <span
                            aria-label={part.text}
                            className={styles.starterEventIcon}
                            role="img"
                            title={part.text}
                        >
                            <span aria-hidden="true">
                                <Icon
                                    category={{...EVENT_INFO.event_whenkeypressed, options: {key: {value: part.key}}}}
                                    inline
                                    isEvent={false}
                                />
                            </span>
                        </span>
                    );
                } else if (part.type === 'input') {
                    const inputBlock = targetBlocks[part.id];
                    const value = inputBlock && getSnapshotReporterValue(inputBlock, snapshot, editingTarget);
                    content = (
                        <span
                            className={`${part.literal ? styles.literalInput :
                                `${styles.reporterInput} ${
                                    inputBlock ? styles[getBlockCategory(inputBlock.opcode)] : ''
                                }`} ${part.id === highlightedBlock ? styles.active : ''}`}
                            ref={part.id === highlightedBlock ? highlightedRef : null}
                        >
                            {part.label ? (
                                <BlockLabel
                                    label={part.label}
                                    targetBlocks={targetBlocks}
                                    snapshot={snapshot}
                                    editingTarget={editingTarget}
                                    highlightedBlock={highlightedBlock}
                                    highlightedRef={highlightedRef}
                                />
                            ) : '?'}
                            <FrameValue value={value} />
                        </span>
                    );
                } else {
                    content = part.text;
                }
                return <React.Fragment key={index}>{index > 0 && ' '}{content}</React.Fragment>;
            })}
        </span>
    );
};

/**
 * Show a directly recorded scalar as selected-frame state.
 * @param {object} props The snapshot value, if one is available.
 * @return {?JSX.Element} The frame-value annotation or nothing.
 */
const FrameValue = ({value}) => {
    if (value === null || !['string', 'number', 'boolean'].includes(typeof value)) return null;
    return (
        <span className={styles.snapshotValue}>
            {' '}
            <FormattedMessage
                defaultMessage="({value})"
                description="Recorded value of a reporter at the selected frame"
                id="gui.activeCode.snapshotValue"
                values={{value: String(value)}}
            />
        </span>
    );
};

FrameValue.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
};

BlockLabel.propTypes = {
    label: PropTypes.shape({
        parts: PropTypes.arrayOf(PropTypes.shape({text: PropTypes.string})).isRequired,
        unsupported: PropTypes.bool.isRequired
    }),
    targetBlocks: PropTypes.shape({}).isRequired,
    snapshot: PropTypes.shape({}),
    editingTarget: PropTypes.string,
    highlightedBlock: PropTypes.string,
    highlightedRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired
};

/**
 * Turn a localized block label into readable text for the frame-value list.
 * @param {object} label The Scratch block label.
 * @returns {string} A readable label.
 */
const labelText = label => (label ? label.parts.map(part => (
    part.type === 'input' ? labelText(part.label) || '?' : part.text || part.alt || ''
)).filter(Boolean)
    .join(' ') : '');

/**
 * Collect directly recorded reporter values reachable from a script.
 * @param {string} topBlock The first script block ID.
 * @param {object} targetBlocks The selected target's blocks.
 * @param {object} snapshot The selected recorded frame.
 * @param {string} editingTarget The target whose state is displayed.
 * @param {object} labels Localized block labels by ID.
 * @returns {Array<object>} Reporter labels and values.
 */
export const getScriptFrameValues = (topBlock, targetBlocks, snapshot, editingTarget, labels) => {
    const values = [];
    const visited = new Set();
    // visit each block in the script recursively to collect reporter values
    const visit = id => {
        const block = id && targetBlocks[id];
        if (!block || visited.has(id)) return;
        visited.add(id);
        const value = getSnapshotReporterValue(block, snapshot, editingTarget);
        if (value !== null && ['string', 'number', 'boolean'].includes(typeof value)) {
            values.push({id, label: labelText(labels[id]) || block.opcode, value});
        }
        Object.values(block.inputs || {}).forEach(input => visit(input && input.block));
        visit(block.next);
    };
    visit(topBlock);
    return values;
};

/**
 * Render and highlight a static copy of a native Scratch Blocks script.
 * @param {object} props The XML, editor configuration and selected block.
 * @returns {JSX.Element} The read-only native script or an explicit fallback.
 */
const NativeScript = ({
    xml, scriptId, locale, theme, isRtl, useCatBlocks, highlightedBlock, highlightedRef, description, fallback, children
}) => {
    const canvasRef = useRef(null);
    const svgRef = useRef(null);
    const [failed, setFailed] = useState(false);

    useLayoutEffect(() => {
        if (!canvasRef.current) return () => {};
        const canvas = canvasRef.current;
        try {
            // Use the same Scratch Blocks variant as the editor, without taking ownership of its workspace.
            const blocks = useCatBlocks ? require('cat-blocks') : require('scratch-blocks');
            const svg = renderNativeScript(blocks, xml, scriptId, locale, {
                colours: theme ? getColorsForTheme(theme) : null,
                rtl: isRtl
            });
            svg.classList.add(styles.nativeScript);
            canvas.appendChild(svg);
            svgRef.current = svg;
            setFailed(false);
            return () => {
                svgRef.current = null;
                svg.remove();
            };
        } catch (error) {
            log.warn(`Unable to render native Scratch script ${scriptId}`, error);
            setFailed(true);
            return () => {};
        }
    }, [xml, scriptId, locale, theme, isRtl, useCatBlocks]);

    useLayoutEffect(() => {
        const svg = svgRef.current;
        if (!svg || !highlightedBlock) return () => {};
        const block = Array.from(svg.querySelectorAll('[data-id]'))
            .find(element => element.getAttribute('data-id') === highlightedBlock);
        const path = block && Array.from(block.children).find(element => element.tagName.toLowerCase() === 'path');
        if (!path) return () => {};
        path.classList.add(styles.nativeActivePath);
        highlightedRef.current = path;
        return () => {
            path.classList.remove(styles.nativeActivePath);
            if (highlightedRef.current === path) highlightedRef.current = null;
        };
    }, [highlightedBlock, highlightedRef, xml, scriptId, locale, theme, isRtl, useCatBlocks]);

    return (
        <React.Fragment>
            <div
                aria-label={description}
                className={styles.nativeCanvas}
                ref={canvasRef}
                role="img"
            />
            {failed && (
                <React.Fragment>
                    <p className={styles.renderWarning}>
                        <FormattedMessage
                            defaultMessage="Scratch block preview unavailable; showing a simplified script."
                            description="Notice shown when the native Scratch script cannot be rendered"
                            id="gui.activeCode.renderWarning"
                        />
                    </p>
                    {fallback}
                </React.Fragment>
            )}
            {!failed && children}
        </React.Fragment>
    );
};

NativeScript.propTypes = {
    xml: PropTypes.string.isRequired,
    scriptId: PropTypes.string.isRequired,
    locale: PropTypes.string.isRequired,
    theme: PropTypes.string,
    isRtl: PropTypes.bool,
    useCatBlocks: PropTypes.bool,
    highlightedBlock: PropTypes.string,
    highlightedRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired,
    description: PropTypes.string.isRequired,
    fallback: PropTypes.node.isRequired,
    children: PropTypes.node
};

/**
 * Keep each thread's highlighted block visible without scrolling the surrounding timeline.
 * @param {object} props The thread, selected frame and panel size.
 * @return {JSX.Element} The independently scrollable thread.
 */
const ActiveThread = ({
    thread, timeFrame, editingTarget, targetBlocks, panelSize, focusRequest, labels, snapshot,
    xml, locale, theme, isRtl, useCatBlocks, intl
}) => {
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
            const bottom = top + container.clientHeight;
            if (blockRect.top < top) {
                container.scrollTop += blockRect.top - top;
            } else if (blockRect.bottom > bottom) {
                container.scrollTop += blockRect.bottom - bottom;
            }
        };

        keepHighlightedVisible();
        if (typeof ResizeObserver !== 'undefined' && container) {
            const observer = new ResizeObserver(keepHighlightedVisible);
            observer.observe(container);
            return () => observer.disconnect();
        }
        return () => {};
    }, [thread.highlightedBlock, timeFrame, editingTarget, targetBlocks, panelSize, focusRequest]);

    const fallback = (
        <ScriptBlocks
            blocks={thread.blocks}
            highlightedBlock={thread.highlightedBlock}
            highlightedRef={highlightedRef}
            labels={labels}
            targetBlocks={targetBlocks}
            snapshot={snapshot}
            editingTarget={editingTarget}
        />
    );
    const values = xml ? getScriptFrameValues(thread.id, targetBlocks, snapshot, editingTarget, labels) : [];
    const currentLabel = labelText(labels[thread.highlightedBlock]) || intl.formatMessage(messages.unknownBlock);
    const starterLabel = labelText(labels[thread.id]) || intl.formatMessage(messages.unknownBlock);
    const frameValues = values.length > 0 && (
        <div className={styles.frameValues}>
            <FormattedMessage
                defaultMessage="Values at this frame"
                description="Heading for values recorded in the selected frame"
                id="gui.activeCode.frameValues"
            />
            <ul>
                {values.map(value => (
                    <li key={value.id}>{`${value.label}: ${String(value.value)}`}</li>
                ))}
            </ul>
        </div>
    );
    return (
        <div
            className={styles.thread}
            ref={threadRef}
        >
            {xml ? (
                <NativeScript
                    description={intl.formatMessage(messages.script, {starter: starterLabel, block: currentLabel})}
                    fallback={fallback}
                    highlightedBlock={thread.highlightedBlock}
                    highlightedRef={highlightedRef}
                    locale={locale}
                    isRtl={isRtl}
                    scriptId={thread.id}
                    theme={theme}
                    useCatBlocks={useCatBlocks}
                    xml={xml}
                >
                    {frameValues}
                </NativeScript>
            ) : (
                <React.Fragment>
                    <p className={styles.renderWarning}>
                        <FormattedMessage
                            defaultMessage="Scratch block preview unavailable; showing a simplified script."
                            description="Notice shown when the native Scratch script cannot be rendered"
                            id="gui.activeCode.renderWarning"
                        />
                    </p>
                    {fallback}
                </React.Fragment>
            )}
        </div>
    );
};

ActiveThread.propTypes = {
    thread: PropTypes.shape({
        id: PropTypes.string.isRequired,
        blocks: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
        highlightedBlock: PropTypes.string
    }).isRequired,
    timeFrame: PropTypes.number.isRequired,
    editingTarget: PropTypes.string,
    targetBlocks: PropTypes.shape({}).isRequired,
    panelSize: PropTypes.number.isRequired,
    focusRequest: PropTypes.number.isRequired,
    labels: PropTypes.shape({}).isRequired,
    snapshot: PropTypes.shape({}),
    xml: PropTypes.string,
    locale: PropTypes.string.isRequired,
    theme: PropTypes.string,
    isRtl: PropTypes.bool,
    useCatBlocks: PropTypes.bool,
    intl: intlShape.isRequired
};

/**
 * Render the active Scratch threads as a compact, read-only code view.
 * @param {object|null} context The debugger context containing recorded snapshots.
 * @param {number} timeFrame The selected snapshot index.
 * @param {string} editingTarget The selected target ID.
 * @param {object} targetBlocks The selected target's block map.
 * @return {JSX.Element} The active code panel.
 */
const ActiveCodeBlocks = ({context, timeFrame, editingTarget, targetBlocks, intl, theme, isRtl, useCatBlocks}) => {
    const threads = getActiveCodeThreads(context, timeFrame, editingTarget, targetBlocks);
    const labels = threads.length ? getBlockLabels(targetBlocks, threads.map(thread => thread.id), intl.locale) : {};
    const snapshot = context && context.log && context.log.snapshots && context.log.snapshots[timeFrame];
    const [panelSize, setPanelSize] = useState(40);
    const [focusRequest, setFocusRequest] = useState(0);
    const runtime = context && context.vm && context.vm.runtime;
    const target = runtime && runtime.getTargetById && runtime.getTargetById(editingTarget);

    /**
     * Serialize the displayed target's script using the VM's existing serializer.
     * @param {string} id The top block ID.
     * @returns {?string} Scratch Blocks XML or null if the target is unavailable.
     */
    const scriptXml = id => {
        if (!target || !target.blocks || target.blocks._blocks !== targetBlocks) return null;
        try {
            return target.blocks.blockToXML(id, target.comments) || null;
        } catch (error) {
            log.warn(`Unable to serialize active Scratch script ${id}`, error);
            return null;
        }
    };

    /**
     * Set the panel height as a percentage of the timeline area.
     * @param {Event} event The resize slider change event.
     * @returns {void}
     */
    const handlePanelSizeChange = useCallback(event => {
        setPanelSize(Number(event.target.value));
    }, []);

    /**
     * Request each thread to bring its highlighted block back into view.
     * @returns {void}
     */
    const handleFocus = useCallback(() => {
        setFocusRequest(previous => previous + 1);
    }, []);

    return (
        <section
            className={styles.panel}
            aria-label={intl.formatMessage(messages.panel)}
            style={{height: `${panelSize}%`}}
        >
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <FormattedMessage
                        defaultMessage="Active code"
                        description="Title of the active code panel"
                        id="gui.activeCode.title"
                    />
                </h2>
                <div className={styles.controls}>
                    <button
                        aria-label={intl.formatMessage(messages.focus)}
                        className={styles.focusButton}
                        title={intl.formatMessage(messages.focus)}
                        type="button"
                        disabled={threads.length === 0}
                        onClick={handleFocus}
                    >
                        <img
                            alt=""
                            className={styles.focusIcon}
                            draggable={false}
                            src={focusIcon}
                        />
                    </button>
                    <label className={styles.resizeLabel}>
                        <FormattedMessage
                            defaultMessage="Panel size"
                            description="Label for the active code panel size slider"
                            id="gui.activeCode.panelSize"
                        />
                        <input
                            className={styles.resizeInput}
                            type="range"
                            min="32"
                            max="72"
                            step="4"
                            value={panelSize}
                            onChange={handlePanelSizeChange}
                        />
                    </label>
                </div>
            </div>
            {threads.length === 0 ? (
                <p className={styles.empty}>
                    <FormattedMessage
                        defaultMessage="No code is running at this frame."
                        description="Empty state for the active code panel"
                        id="gui.activeCode.empty"
                    />
                </p>
            ) : (
                <div className={styles.threadList}>
                    {threads.map((thread, index) => (
                        <ActiveThread
                            key={`${thread.id}:${index}`}
                            thread={thread}
                            timeFrame={timeFrame}
                            editingTarget={editingTarget}
                            targetBlocks={targetBlocks}
                            panelSize={panelSize}
                            focusRequest={focusRequest}
                            labels={labels}
                            snapshot={snapshot}
                            xml={scriptXml(thread.id)}
                            locale={intl.locale}
                            theme={theme}
                            isRtl={isRtl}
                            useCatBlocks={useCatBlocks}
                            intl={intl}
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
        }).isRequired,
        vm: PropTypes.shape({
            runtime: PropTypes.shape({getTargetById: PropTypes.func})
        })
    }),
    timeFrame: PropTypes.number.isRequired,
    editingTarget: PropTypes.string,
    targetBlocks: PropTypes.shape({}).isRequired,
    intl: intlShape.isRequired,
    theme: PropTypes.string,
    isRtl: PropTypes.bool,
    useCatBlocks: PropTypes.bool
};

const ConnectedActiveCodeBlocks = injectIntl(ActiveCodeBlocks);

/**
 * Supply local Active Code translations without replacing the editor's message catalog.
 * @param {object} props The editor's internationalization context and panel props.
 * @returns {JSX.Element} The localized Active Code panel.
 */
const LocalizedActiveCodeBlocks = ({intl, ...props}) => (
    <IntlProvider
        locale={intl.locale}
        messages={{...localMessages[intl.locale.split('-')[0]], ...intl.messages}}
    >
        <ConnectedActiveCodeBlocks {...props} />
    </IntlProvider>
);

LocalizedActiveCodeBlocks.propTypes = {intl: intlShape.isRequired};

export default injectIntl(LocalizedActiveCodeBlocks);
