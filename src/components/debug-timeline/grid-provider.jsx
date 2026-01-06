import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Grid from './grid.jsx';
import GridContext from './grid-context.js';

const GridProvider = ({ timeTicks, tickSize, isGap, children }) => {
    const grid = useMemo(() => {
        return (
            <Grid
                timeTicks={timeTicks}
                tickSize={tickSize}
                isGap={isGap}
            />
        );
    }, [timeTicks, tickSize, isGap]);

    return (
        <GridContext.Provider value={grid}>
            {children}
        </GridContext.Provider>
    );
};

GridProvider.propTypes = {
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default GridProvider;
