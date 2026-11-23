import React, {useCallback, useEffect, useRef} from 'react';
import PropTypes from 'prop-types';
import {KEY_OPTIONS, toggleSelectedKey} from './key-options.js';
import styles from './debug-timeline.css';

/**
 * Provide a persistent multi-key filter for the debug timeline.
 * @param {object} props Selection and update callback.
 * @returns {React.ReactElement} Keyboard-accessible selector.
 */
const KeySelector = ({
    selectedKeys, onChange, showRedHolds, onShowRedHoldsChange, showSeparate, onShowSeparateChange
}) => {
    const selectorRef = useRef(null);
    const handleChange = useCallback(event => {
        onChange(toggleSelectedKey(selectedKeys, event.target.value));
    }, [selectedKeys, onChange]);
    useEffect(() => {
        const closeOutside = event => {
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                selectorRef.current.open = false;
            }
        };
        const closeOnEscape = event => {
            if (event.key === 'Escape' && selectorRef.current && selectorRef.current.open) {
                selectorRef.current.open = false;
                selectorRef.current.querySelector('summary').focus();
            }
        };
        document.addEventListener('click', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('click', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, []);
    return (
        <details
            className={styles.keySelector}
            ref={selectorRef}
        >
            <summary className={styles.keySelectorButton}>
                {selectedKeys.includes('any') ? 'Keys: any' : `Keys: ${selectedKeys.length} selected`}
            </summary>
            <div className={styles.keySelectorPopup}>
                <div className={styles.keySelectorSpecial}>
                    <label className={styles.keySelectorOption}>
                        <input
                            checked={selectedKeys.includes('any')}
                            type="checkbox"
                            value="any"
                            onChange={handleChange}
                        />
                        {'Any key'}
                    </label>
                    <label className={styles.keySelectorOption}>
                        <input
                            checked={showRedHolds}
                            type="checkbox"
                            onChange={onShowRedHoldsChange}
                        />
                        {'Show red key holds'}
                    </label>
                    <label className={styles.keySelectorOption}>
                        <input
                            checked={showSeparate}
                            type="checkbox"
                            onChange={onShowSeparateChange}
                        />
                        {'Show separate key rows'}
                    </label>
                </div>
                <div className={styles.keySelectorOptions}>
                    {KEY_OPTIONS.map(key => (
                        <label
                            key={key}
                            className={styles.keySelectorOption}
                        >
                            <input
                                checked={selectedKeys.includes(key)}
                                type="checkbox"
                                value={key}
                                onChange={handleChange}
                            />
                            {key}
                        </label>
                    ))}
                </div>
            </div>
        </details>
    );
};

KeySelector.propTypes = {
    selectedKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
    showRedHolds: PropTypes.bool.isRequired,
    onShowRedHoldsChange: PropTypes.func.isRequired,
    showSeparate: PropTypes.bool.isRequired,
    onShowSeparateChange: PropTypes.func.isRequired
};

export default KeySelector;
