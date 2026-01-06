import React from 'react';
import PropTypes from 'prop-types';
import Grid from './grid.jsx';
import styles from './debug-timeline.css';
import GridContext from './grid-context.js';

const Row = ({
    id,
    children
}) => {
    const grid = React.useContext(GridContext);

    return (
        <div
            key={`track-container-${id}`}
            className={styles.trackContainer}
        >
            {grid}
            {children}
        </div>
    );
};

Row.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

export default Row;
