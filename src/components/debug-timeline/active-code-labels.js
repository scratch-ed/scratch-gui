import ScratchBlocks from 'scratch-blocks';
import log from '../../lib/log';

const variableFields = {
    VARIABLE: '',
    LIST: 'list',
    BROADCAST_OPTION: 'broadcast_msg'
};

/**
 * Register the variables referenced by the block map in an isolated workspace.
 * @param {object} workspace A temporary Scratch Blocks workspace.
 * @param {object} blocks The selected target's VM block map.
 * @returns {void}
 */
const registerVariables = (workspace, blocks) => {
    Object.values(blocks).forEach(block => {
        Object.values(block.fields || {}).forEach(field => {
            if (field && field.id && Object.prototype.hasOwnProperty.call(variableFields, field.name) &&
                !workspace.getVariableById(field.id)) {
                const type = field.variableType || variableFields[field.name];
                if (!workspace.getVariable(field.value, type)) {
                    workspace.createVariable(field.value, type, field.id);
                }
            }
        });
    });
};

/**
 * Read ordered, localized Scratch labels and value inputs without modifying the editor workspace.
 * @param {object} blocks The selected target's VM block map.
 * @param {Array<string>} blockIds Script block IDs to describe.
 * @param {string} locale The selected editor language.
 * @return {object} Label parts indexed by block ID.
 */
export const getBlockLabels = (blocks, blockIds, locale) => {
    const labels = {};
    const workspace = new ScratchBlocks.Workspace();
    const previousMessages = ScratchBlocks.Msg;
    const previousLocale = ScratchBlocks.ScratchMsgs.currentLocale_;
    const visiting = new Set();
    // Blockly shares locale and event state with the editable workspace.
    ScratchBlocks.Events.disable();
    try {
        if (!ScratchBlocks.ScratchMsgs.locales[locale]) {
            log.warn(`Scratch block labels are unavailable for locale ${locale}; using English`);
        }
        ScratchBlocks.ScratchMsgs.setLocale(ScratchBlocks.ScratchMsgs.locales[locale] ? locale : 'en');
        registerVariables(workspace, blocks);

        /**
         * Describe one block and its connected reporter inputs.
         * @param {string} id VM block ID.
         * @returns {object} The localized label and input parts.
         */
        const describe = id => {
            if (labels[id]) return labels[id];
            const block = blocks[id];
            if (!block || visiting.has(id)) return null;
            const fallback = {parts: [{type: 'text', text: block.opcode}], unsupported: true};
            if (!ScratchBlocks.Blocks[block.opcode]) {
                labels[id] = fallback;
                return fallback;
            }
            visiting.add(id);
            try {
                const definition = workspace.newBlock(block.opcode, id);
                const parts = [];
                for (const input of definition.inputList) {
                    // The existing script renderer handles statement branches separately.
                    if (input.type === ScratchBlocks.NEXT_STATEMENT) break;
                    input.fieldRow.forEach(field => {
                        const saved = block.fields && block.fields[field.name];
                        if (saved) {
                            const value = saved.id && Object.prototype.hasOwnProperty.call(variableFields, field.name) ?
                                saved.id : saved.value;
                            field.setValue(value);
                        }
                        if (field instanceof ScratchBlocks.FieldImage) {
                            const src = field.getValue();
                            if (src && !/repeat\.svg$/.test(src)) {
                                parts.push({type: 'icon', src, alt: field.getText()});
                            }
                        } else {
                            const text = saved && String(field.getValue()) !== String(
                                saved.id && Object.prototype.hasOwnProperty.call(variableFields, field.name) ?
                                    saved.id : saved.value
                            ) ? String(saved.value) : field.getText();
                            if (text !== '') parts.push({type: 'text', text});
                        }
                    });
                    if (input.type === ScratchBlocks.INPUT_VALUE) {
                        const value = block.inputs && block.inputs[input.name];
                        const child = value && value.block && blocks[value.block];
                        const childLabel = child && describe(value.block);
                        parts.push({
                            type: 'input',
                            id: value && value.block,
                            literal: Boolean(child && (child.shadow || /^math_/.test(child.opcode) ||
                                child.opcode === 'text' || child.opcode === 'colour_picker' ||
                                /_menu$/.test(child.opcode))),
                            label: childLabel
                        });
                    }
                }
                labels[id] = {parts, unsupported: false};
                return labels[id];
            } catch (error) {
                log.warn(`Unable to describe Scratch block ${block.opcode}`, error);
                labels[id] = fallback;
                return fallback;
            } finally {
                visiting.delete(id);
            }
        };

        const visitedScripts = new Set();
        /**
         * Visit sequential script blocks and their nested statement branches.
         * @param {string} id The first block ID in a script.
         * @returns {void}
         */
        const describeScript = id => {
            while (id && blocks[id] && !visitedScripts.has(id)) {
                visitedScripts.add(id);
                const block = blocks[id];
                describe(id);
                Object.keys(block.inputs || {}).filter(name => /^SUBSTACK\d*$/.test(name))
                    .forEach(name => describeScript(block.inputs[name].block));
                id = block.next;
            }
        };
        blockIds.forEach(describeScript);
    } finally {
        try {
            workspace.dispose();
        } finally {
            ScratchBlocks.Msg = previousMessages;
            ScratchBlocks.ScratchMsgs.currentLocale_ = previousLocale;
            ScratchBlocks.Events.enable();
        }
    }
    return labels;
};

/**
 * Find a directly recorded reporter value at the selected frame.
 * @param {object} block A VM reporter block.
 * @param {object} snapshot The selected itch snapshot.
 * @param {string} targetId The thread's target ID.
 * @returns {*} The recorded scalar value, or undefined when unavailable.
 */
export const getSnapshotReporterValue = (block, snapshot, targetId) => {
    const target = snapshot && snapshot.targets && snapshot.targets.find(item => item.id === targetId);
    if (!target || !block) return;
    if (block.opcode === 'data_variable') {
        const field = block.fields && block.fields.VARIABLE;
        if (!field || !field.id) return;
        const stage = snapshot.stage;
        const variables = (target.variables || []).concat(stage && stage.id !== target.id ? stage.variables || [] : []);
        const variable = variables.find(item => item.id === field.id && item.type === '');
        return variable && variable.value;
    }
    const properties = {
        motion_xposition: 'x',
        motion_yposition: 'y',
        motion_direction: 'direction',
        looks_size: 'size',
        sound_volume: 'volume'
    };
    const property = properties[block.opcode];
    if (property) return target[property];
};
