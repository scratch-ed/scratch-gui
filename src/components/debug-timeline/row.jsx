import React from 'react';
import PropTypes from 'prop-types';
import styles from './debug-timeline.css';
import GridContext from './grid-context.js';

const Row = ({
    id,
    compact = false,
    children
}) => {
    const grid = React.useContext(GridContext);

    return (
        <div
            key={`track-container-${id}`}
            className={`${styles.trackContainer} ${compact ? styles.eventSubrow : ''}`}
        >
            {grid}
            {children}
        </div>
    );
};

Row.propTypes = {
    id: PropTypes.string.isRequired,
    compact: PropTypes.bool,
    children: PropTypes.node.isRequired
};

export default Row;
