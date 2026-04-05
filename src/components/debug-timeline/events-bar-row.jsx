import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedPlotPosition} from './helpers.ts';
import ReactTooltip from "react-tooltip";
import styles from '../timeline/timeline.css';
import GapTooltip from "./gap-tooltip.jsx";
import Event from "./event.jsx";

const groupEventsByGaps = (events, timeTicks, tickSize, eventIsInGap) => {
    const visibleEvents = [];
    const gapGroups = new Map();

    for (const event of events) {
        if (eventIsInGap(event.begin)) {
            const position = getCompressedPlotPosition(
                event.begin,
                timeTicks,
                tickSize
            );

            if (gapGroups.has(position)) {
                gapGroups.get(position).events.push(event);
            } else {
                gapGroups.set(position, {
                    left: position,
                    events: [event]
                });
            }
        } else {
            visibleEvents.push(event);
        }
    }

    return {visibleEvents: visibleEvents, gapEvents: gapGroups};
};

const EventsBarRow = ({
    activeTargetName,
    events,
    timeTicks,
    tickSize,
    eventIsInGap,
    onBroadcastClick
}) => {
    const {visibleEvents, gapEvents} = groupEventsByGaps(events, timeTicks, tickSize, eventIsInGap);

    return (
        <>
            {visibleEvents.map((event, index) => {
                const left = getCompressedPlotPosition(
                    event.begin,
                    timeTicks,
                    tickSize
                );

                return (
                    <Event
                        key={index}
                        index={index}
                        activeTargetName={activeTargetName}
                        position={left}
                        event={event}
                        transparent={false}
                        onBroadcastClick={onBroadcastClick}
                    />
                );
            })}
            {Array.from(gapEvents.values()).map((gapGroup, index) => {
                return (
                    <div
                        key={`gap-${index}`}
                    >
                        <div
                            className={styles.tooltipDataGap}
                            data-for={`gap-${index}`}
                            data-tip=""
                            style={{
                                left: `${gapGroup.left - 8}px`
                            }}
                        />
                        <ReactTooltip
                            id={`gap-${index}`}
                            className={styles.tooltip}
                            effect="solid"
                            place="left"
                        >
                            <GapTooltip gapGroup={gapGroup} />
                        </ReactTooltip>
                    </div>
                );
            })}
        </>
    );
};

EventsBarRow.propTypes = {
    activeTargetName: PropTypes.string,
    events: PropTypes.arrayOf(PropTypes.object),
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    eventIsInGap: PropTypes.func.isRequired,
    onBroadcastClick: PropTypes.func
};

export default EventsBarRow;
