import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './gradient.css';

const Gradient = ({ selectedVariables, spriteData }) => {
    const containerRef = useRef(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Utility function to format domain values for display
    const formatDomainValue = (value, variable) => {
        if (variable === 'visible') {
            return value === 0 ? 'false' : 'true';
        }
        return value.toFixed(1);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
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

    const createGradientVisualization = (data, variable) => {
        if (!data || !data[variable]) return null;

        const values = data[variable].filter(v => !isNaN(v));
        const cleanData = [...values];

        if (cleanData.length === 0) return null;

        const minValue = Math.min(...cleanData);
        const maxValue = Math.max(...cleanData);

        // Create color scale based on variable type
        let domain;
        if (variable === 'x') {
            domain = [-240, 240];
        } else if (variable === 'y') {
            domain = [-180, 180];
        } else if (variable === 'visible') {
            domain = [0, 1]; // Boolean values converted to 0 and 1
        } else if (variable === 'size') {
            domain = [0, maxValue]; // Typical size range
        } else if (variable === 'direction') {
            domain = [0, 360]; // Direction in degrees
        } else {
            // For any other variables, use the actual min/max but ensure proper order
            domain = [minValue, maxValue];
        }

        return {
            minValue,
            maxValue,
            domain,
            cleanData
        };
    };

    const renderGradientCanvas = (visualization, variable) => {
        if (!visualization) return null;

        const { minValue, maxValue, domain, cleanData } = visualization;
        const dataLength = cleanData.length;

        return (
            <div className={styles.gradientItem}>
                <div className={styles.gradientInfo}>
                    Variable: {variable}
                </div>
                <div className={styles.legend}>
                    <span>Low ({formatDomainValue(domain[0], variable)})</span>
                    <div className={styles.legendGradient}></div>
                    <span>High ({formatDomainValue(domain[1], variable)})</span>
                </div>
                <canvas
                    ref={(canvas) => {
                        if (canvas && cleanData.length > 0) {
                            const ctx = canvas.getContext('2d');
                            const width = cleanData.length;
                            const height = 100;

                            canvas.width = width;
                            canvas.height = height;

                            // Create gradient for each position
                            cleanData.forEach((value, index) => {
                                const normalizedValue = (value - domain[0]) / (domain[1] - domain[0]);
                                const intensity = Math.max(0, Math.min(1, normalizedValue));

                                // Blue gradient: light blue (low) to dark blue (high)
                                // Light blue RGB: (150, 182, 255), Dark blue RGB: (0, 61, 153)
                                const red = Math.floor(150 * (1 - intensity));
                                const green = Math.floor(182 * (1 - intensity * 0.66));
                                const blue = Math.floor(255 * (1 - intensity * 0.4));

                                ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                                ctx.fillRect(index, 0, 1, height);
                            });
                        }
                    }}
                    className={styles.gradientCanvas}
                    style={{
                        width: '100%',
                        height: '100px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
            </div>
        );
    };

    return (
        <div className={styles.gradientContainer}>
            <div
                className={`${styles.diagramContainer} ${isDragging ? styles.dragging : ''}`}
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div
                    className={`${styles.gradientWrapper} ${isDragging ? styles.dragging : ''} ${selectedVariables.size === 0 ? styles.centered : ''}`}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`
                    }}
                >
                    {selectedVariables.size === 0 ? (
                        <div className={styles.emptyState}>
                            Select variables above to display a gradient for it
                        </div>
                    ) : (
                        <div className={styles.gradientsContainer}>
                            {Array.from(selectedVariables).map((variable, index) => {
                                const visualization = createGradientVisualization(spriteData, variable);
                                const isLast = index === selectedVariables.size - 1;
                                return (
                                    <React.Fragment key={variable}>
                                        {renderGradientCanvas(visualization, variable)}
                                        {!isLast && <div className={styles.divider}></div>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

Gradient.propTypes = {
    selectedVariables: PropTypes.object,
    spriteData: PropTypes.object
};

export default Gradient;
