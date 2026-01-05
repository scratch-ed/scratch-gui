import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedPlotPosition} from './helpers.ts';
import Icon from './icons.jsx';

const EventsBarRow = ({
    events,
    timeTicks,
    tickSize
}) => (
    events.map((event, index) => {
        const left = getCompressedPlotPosition(
            event.begin,
            timeTicks,
            tickSize
        );

        return (
            <div
                key={`event-${index}`}
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                }}
            >
                <Icon
                    event={event}
                    isEvent={true}
                />
            </div>
        );
    })
);

EventsBarRow.propTypes = {
    events: PropTypes.arrayOf(PropTypes.object),
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired
};

export default EventsBarRow;
