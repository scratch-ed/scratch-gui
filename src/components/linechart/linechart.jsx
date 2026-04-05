import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './linechart.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const LineChart = ({ editingTarget, context, onClose }) => {
    const containerRef = useRef(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedVariables, setSelectedVariables] = useState(new Set()); // No default selection
    const [availableVariables, setAvailableVariables] = useState(['size', 'x', 'y', 'direction']);
    const [spriteData, setSpriteData] = useState(null);

    // Update sprite data when editing target or context changes
    useEffect(() => {
        const vars = new Set(['size', 'x', 'y', 'direction']);

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
    }, [editingTarget, context]);

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleMouseDown = e => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = e => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const getTargetData = () => {
        return spriteData;
    };


    const prepareChartData = (selectedVariables) => {
        const spriteData = getTargetData();

        if (!spriteData) {
            return { labels: [], datasets: [] };
        }

        const labels = spriteData.timestamps.map(timestamp => timestamp);
        const datasets = [];

        selectedVariables.forEach(variableName => {
            let data;
            let label;
            let borderColor;

            if (variableName === 'size') {
                data = spriteData.size;
                label = 'Size';
                borderColor = 'rgb(75, 192, 192)';
            } else if (variableName === 'x') {
                data = spriteData.x;
                label = 'X Position';
                borderColor = 'rgb(255, 99, 132)';
            } else if (variableName === 'y') {
                data = spriteData.y;
                label = 'Y Position';
                borderColor = 'rgb(54, 162, 235)';
            } else if (variableName === 'direction') {
                data = spriteData.direction;
                label = 'Direction';
                borderColor = 'rgb(255, 205, 86)';
            } else {
                data = spriteData.variables[variableName] || [];
                label = variableName.charAt(0).toUpperCase() + variableName.slice(1);
                borderColor = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
            }

            datasets.push({
                label,
                data,
                borderColor,
                backgroundColor: borderColor.replace('rgb', 'rgba').replace(')', ', 0.2)'),
                tension: 0.1,
                fill: false
            });
        });

        return { labels, datasets };
    };

    const toggleVariable = (variableName) => {
        const newSelected = new Set(selectedVariables);
        if (newSelected.has(variableName)) {
            newSelected.delete(variableName);
        } else {
            newSelected.add(variableName);
        }
        setSelectedVariables(newSelected);
    };


    useEffect(() => {
        const handleGlobalMouseMove = e => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!editingTarget) {
        return (
            <div className={styles.container}>
                <div className={styles.placeholder}>
                    Select a sprite to view variable line charts
                </div>
            </div>
        );
    }

    const chartData = prepareChartData(selectedVariables);
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            title: {
                display: true,
                text: 'Variables Over Time',
                font: {
                    size: 14,
                    weight: '600'
                },
                padding: {
                    bottom: 15
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 12
                },
                bodyFont: {
                    size: 11
                },
                padding: 8,
                cornerRadius: 4
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Time (frames)',
                    font: {
                        size: 11
                    }
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    maxTicksLimit: 10
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Value',
                    font: {
                        size: 11
                    }
                },
                ticks: {
                    font: {
                        size: 10
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        elements: {
            point: {
                radius: 2,
                hoverRadius: 4
            },
            line: {
                borderWidth: 1.5
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.variableSelector}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>Select Variables to Display:</h4>
                    <button onClick={handleClose} className={styles.closeButton}>×</button>
                </div>
                <div className={styles.variableList}>
                    {availableVariables.map(variableName => (
                        <label
                            key={variableName}
                            className={styles.variableItem}
                        >
                            <input
                                type="checkbox"
                                checked={selectedVariables.has(variableName)}
                                onChange={() => toggleVariable(variableName)}
                            />
                            {variableName}
                        </label>
                    ))}
                </div>
            </div>
            <div
                className={`${styles.diagramContainer} ${isDragging ? styles.dragging : ''}`}
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div
                    className={`${styles.chartWrapper} ${isDragging ? styles.dragging : ''}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`
                    }}
                >
                    {selectedVariables.size === 0 ? (
                        <div className={styles.emptyState}>
                            Select variables above to display them in the chart
                        </div>
                    ) : (
                        <Line data={chartData} options={chartOptions} />
                    )}
                </div>
            </div>
        </div>
    );
};

LineChart.propTypes = {
    editingTarget: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    context: PropTypes.object,
    onClose: PropTypes.func
};

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    context: state.scratchGui.timeSlider.context
});

export default connect(mapStateToProps)(LineChart);
