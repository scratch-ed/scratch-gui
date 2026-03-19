import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';
import simpleheat from 'simpleheat';

import styles from './heatmap.css';

const Heatmap = ({ stageSize, visible = true, spritePositions }) => {
    const canvasRef = useRef(null);

    const generateHeatmapData = () => {
        if (!spritePositions || spritePositions.length === 0) {
            return [];
        }

        const positionCounts = {};

        spritePositions.forEach(pos => {
            const key = `${Math.round(pos.x)},${Math.round(pos.y)}`;
            positionCounts[key] = (positionCounts[key] || 0) + 1;
        });

        const allPositions = [];
        Object.entries(positionCounts).forEach(([key, count]) => {
            const [x, y] = key.split(',').map(Number);
            allPositions.push({
                x,
                y,
                intensity: Math.min(count, 10)
            });
        });

        return allPositions;
    };

    const normalizePositions = (positions, canvasWidth, canvasHeight) => {
        const scratchMinX = -240;
        const scratchMaxX = 240;
        const scratchMinY = -180;
        const scratchMaxY = 180;

        const scratchRangeX = scratchMaxX - scratchMinX; // 480
        const scratchRangeY = scratchMaxY - scratchMinY; // 360

        return positions.map(pos => ({
            x: ((pos.x - scratchMinX) / scratchRangeX) * canvasWidth,
            y: canvasHeight - (((pos.y - scratchMinY) / scratchRangeY) * canvasHeight),
            intensity: pos.intensity
        }));
    };

    const drawHeatmap = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const positions = generateHeatmapData();
        const normalizedPositions = normalizePositions(positions, canvas.width, canvas.height);

        const heatmapData = normalizedPositions.map(pos => [pos.x, pos.y, pos.intensity]);
        const heat = simpleheat(canvas);

        heat.radius(15, 20);
        heat.max(10);

        // Set data and draw
        heat.data(heatmapData);
        heat.draw();
    };

    useEffect(() => {
        drawHeatmap();
    }, [spritePositions, stageSize]);

    const getCanvasDimensions = () => {
        switch (stageSize) {
            case 'small':
                return {width: 240, height: 180};
            case 'large':
                return {width: 960, height: 720};
            default:
                return {width: 480, height: 360};
        }
    };

    const { width, height } = getCanvasDimensions();

    return (
        <div className={classNames(styles.heatmapContainer, { [styles.hidden]: !visible })}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={styles.heatmapCanvas}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            />
        </div>
    );
};

Heatmap.propTypes = {
    stageSize: PropTypes.string.isRequired,
    visible: PropTypes.bool,
    spritePositions: PropTypes.arrayOf(PropTypes.object)
};

const mapStateToProps = state => ({
    spritePositions: state.scratchGui.timeSlider.spritePositions || []
});

export default connect(mapStateToProps)(Heatmap);
