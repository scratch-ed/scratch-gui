import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedPlotPosition} from './helpers.ts';
import Icon from './icons.jsx';
import ReactTooltip from "react-tooltip";
import styles from '../timeline/timeline.css';
import TooltipContents from '../timeline/tooltip.jsx';

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
            >
                <div
                    data-for={`event-${index}`}
                    data-tip=""
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
                <ReactTooltip
                    id={`event-${index}`}
                    className={styles.tooltip}
                    effect="solid"
                    place="left"
                >
                    <TooltipContents event={event} />
                </ReactTooltip>
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
