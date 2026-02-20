import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedPlotPosition} from './helpers.ts';
import Icon from './icons.jsx';
import ReactTooltip from "react-tooltip";
import styles from '../timeline/timeline.css';
import TooltipContents from '../timeline/tooltip.jsx';
import GapTooltip from "./gap-tooltip.jsx";

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
    eventIsInGap
}) => {
    const {visibleEvents, gapEvents} = groupEventsByGaps(events, timeTicks, tickSize, eventIsInGap);

    const eventAffectsActiveTarget = (event) => {
        return event.sprites.includes(activeTargetName);
    };

    return (
        <>
            {visibleEvents.map((event, index) => {
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
                            className={styles.tooltipData}
                            data-for={`event-${index}`}
                            data-tip=""
                            style={{
                                left: `${left}px`
                            }}
                        >
                            <div
                                className={styles.eventIconContainer}
                                style={{backgroundColor: eventAffectsActiveTarget(event) ? 'rgba(126, 206, 126, 0.5)' : 'rgba(255, 107, 107, 0.5)'}}
                            >
                                <Icon
                                    event={event}
                                    isEvent={true}
                                />
                            </div>
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
                            title="Events in gap"
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
    eventIsInGap: PropTypes.func.isRequired
};

export default EventsBarRow;
