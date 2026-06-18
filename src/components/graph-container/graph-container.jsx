import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LineChart from '../linechart/linechart.jsx';
import Gradient from '../gradient/gradient.jsx';
import styles from './graph-container.css';

const GraphContainer = ({ editingTarget, context, onClose }) => {
    const [activeView, setActiveView] = useState('linechart'); // 'linechart' or 'gradient'
    const [selectedVariables, setSelectedVariables] = useState(new Set());
    const [availableVariables, setAvailableVariables] = useState(['size', 'x', 'y', 'direction', 'visible']);
    const [spriteData, setSpriteData] = useState(null);

    const fetchSpriteData = () => {
        const vars = new Set(['size', 'x', 'y', 'direction', 'visible']);

        if (!context || !context.log || !editingTarget) {
            setAvailableVariables(Array.from(vars));
            setSpriteData(null);
            return;
        }

        try {
            const log = context.log;
            const data = log.extractSpriteData(editingTarget);
            setSpriteData(data);

            if (data && data.variables) {
                // Add all variables from the log data (includes both sprite and stage variables)
                Object.keys(data.variables).forEach(variableName => {
                    vars.add(variableName);
                });
            }
        } catch (error) {
            console.error('Error getting available variables:', error);
            setSpriteData(null);
        }

        setAvailableVariables(Array.from(vars));
    };

    // Update sprite data when editing target or context changes
    useEffect(() => {
        fetchSpriteData();
    }, [editingTarget, context]);

    const handleVariableToggle = (variable) => {
        const newSelected = new Set(selectedVariables);
        if (newSelected.has(variable)) {
            newSelected.delete(variable);
        } else {
            newSelected.add(variable);
        }
        setSelectedVariables(newSelected);
    };

    const toggleView = () => {
        setActiveView(activeView === 'linechart' ? 'gradient' : 'linechart');
    };

    const handleRefresh = () => {
        fetchSpriteData();
    };

    return (
        <div className={styles.graphContainer}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.controls}>
                        <button
                            className={styles.toggleButton}
                            onClick={toggleView}
                        >
                            {activeView === 'linechart' ? 'Switch to Gradient' : 'Switch to Line Chart'}
                        </button>

                        <div className={styles.variableSelector}>
                            <label>Select variables:</label>
                            {availableVariables.map(variable => (
                                <label key={variable} className={styles.variableLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedVariables.has(variable)}
                                        onChange={() => handleVariableToggle(variable)}
                                    />
                                    {variable}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={styles.refreshButton}
                        onClick={handleRefresh}
                    >
                        ↻
                    </button>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                {activeView === 'linechart' ? (
                    <LineChart
                        selectedVariables={selectedVariables}
                        availableVariables={availableVariables}
                        spriteData={spriteData}
                    />
                ) : (
                    <Gradient
                        selectedVariables={selectedVariables}
                        spriteData={spriteData}
                    />
                )}
            </div>
        </div>
    );
};

GraphContainer.propTypes = {
    editingTarget: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    context: PropTypes.object,
    onClose: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    context: state.scratchGui.timeSlider.context
});

export default connect(mapStateToProps)(GraphContainer);
