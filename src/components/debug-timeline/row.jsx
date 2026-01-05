import React from 'react';
import PropTypes from 'prop-types';
import Grid from './grid.jsx';
import styles from './debug-timeline.css';

const Row = ({
    id,
    timeTicks,
    tickSize,
    isGap,
    children
}) => {
    return (
        <div
            key={`track-container-${id}`}
            className={styles.trackContainer}
        >
            <Grid
                key={`${id}-grid`}
                timeTicks={timeTicks}
                tickSize={tickSize}
                isGap={isGap}
            />
            {children}
        </div>
    );
};

Row.propTypes = {
    id: PropTypes.string.isRequired,
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default Row;

