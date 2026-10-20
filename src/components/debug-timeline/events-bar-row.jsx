import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedGap, getCompressedGapPosition} from './gap-utils.js';
import {BAR_WIDTH} from './constants.ts';
import {getCompressedPlotPosition} from './helpers.ts';
import ReactTooltip from 'react-tooltip';
import styles from '../timeline/timeline.css';
import GapTooltip from './gap-tooltip.jsx';
import Event from './event.jsx';

const groupEventsByGaps = (events, timeTicks, tickSize, isGap) => {
    const visibleEvents = [];
    const gapGroups = new Map();

    for (const event of events) {
        const gap = getCompressedGap(event.begin, timeTicks, tickSize, isGap);
        if (gap) {
            const position = getCompressedGapPosition(
                event.begin,
                timeTicks,
                tickSize,
                BAR_WIDTH,
                isGap,
                gap
            );

            if (gapGroups.has(gap.start)) {
                gapGroups.get(gap.start).events.push(event);
            } else {
                gapGroups.set(gap.start, {
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
    isGap,
    onBroadcastClick
}) => {
    const {visibleEvents, gapEvents} =
        groupEventsByGaps(events, timeTicks, tickSize, isGap);

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
            {Array.from(gapEvents.values()).map((gapGroup, index) => (
                <React.Fragment key={`gap-${index}`}>
                    <div>
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
                </React.Fragment>
            ))}
        </>
    );
};

EventsBarRow.propTypes = {
    activeTargetName: PropTypes.string,
    events: PropTypes.arrayOf(PropTypes.object),
    timeTicks: PropTypes.arrayOf(PropTypes.number).isRequired,
    tickSize: PropTypes.number.isRequired,
    isGap: PropTypes.func.isRequired,
    onBroadcastClick: PropTypes.func
};

export default EventsBarRow;
