// These values mirror the Scratch "when key pressed" dropdown.
export const KEY_OPTIONS = [
    'space', 'up arrow', 'down arrow', 'right arrow', 'left arrow',
    ...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
];

/**
 * Convert a VM key or Scratch hat value to a selectable physical key.
 * @param {string} key Recorded key.
 * @returns {string|null} Scratch dropdown value, or null for unsupported keys.
 */
export const getSelectableKey = key => {
    if (typeof key !== 'string') return null;
    const normalized = key.toLowerCase();
    return KEY_OPTIONS.includes(normalized) ? normalized : null;
};

/**
 * Toggle a selector option, keeping "any" exclusive with individual keys.
 * @param {Array<string>} selected Current selection.
 * @param {string} key Selected option.
 * @returns {Array<string>} Updated selection.
 */
export const toggleSelectedKey = (selected, key) => {
    if (key === 'any') return selected.includes('any') ? [] : ['any'];
    const filteredSelected = selected.filter(value => value !== 'any');
    return filteredSelected.includes(key) ? filteredSelected.filter(value => value !== key) : filteredSelected.concat(key);
};

/**
 * Check whether a supported physical key is selected.
 * @param {string} key Scratch dropdown key value.
 * @param {Array<string>} selected Current selection.
 * @returns {boolean} Whether the key is visible.
 */
export const isKeySelected = (key, selected) => (
    key !== null && (selected.includes('any') || selected.includes(key))
);
