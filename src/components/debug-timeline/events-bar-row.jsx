import React from 'react';
import PropTypes from 'prop-types';
import {getCompressedGap, getCompressedGapPosition} from './gap-utils.js';
import {BAR_WIDTH} from './constants.ts';
import {getCompressedPlotPosition} from './helpers.ts';
import ReactTooltip from 'react-tooltip';
import styles from '../timeline/timeline.css';
import GapTooltip from './gap-tooltip.jsx';
import Event from './event.jsx';
import {getKeyHolds} from './key-holds.js';
import debugStyles from './debug-timeline.css';

const groupEventsByGaps = (events, timeTicks, tickSize, isGap, holdReactions) => {
    const visibleEvents = [];
    const gapGroups = new Map();

    for (const event of events) {
        const gap = holdReactions.has(event) ? null : getCompressedGap(event.begin, timeTicks, tickSize, isGap);
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
    timestampEnd,
    onBroadcastClick
}) => {
    const {holds, events: displayEvents} = getKeyHolds(events, activeTargetName);
    // Determine which key input events are associated with reactions for the active target.
    const holdReactions = new Set(holds.flatMap(hold => hold.inputs.flatMap(input =>
        input.events.filter(event => event.sprites.includes(activeTargetName))
    )));
    const {visibleEvents, gapEvents} =
        groupEventsByGaps(displayEvents, timeTicks, tickSize, isGap, holdReactions);

    return (
        <>
            {holds.map((hold, index) => {
                // Compute the position and size of the key hold for rendering.
                const left = getCompressedPlotPosition(hold.start, timeTicks, tickSize);
                const end = hold.end === null ? timestampEnd : hold.end;
                const width = Math.max(8, getCompressedPlotPosition(end, timeTicks, tickSize) - left);
                const endDescription = hold.end === null ? `still held at ${end} ms` :
                    hold.truncated ? `history ends at ${end} ms` : `released at ${end} ms`;
                const description = `${hold.key} was pressed from ${hold.start} ms until ${endDescription}; ` +
                    `${Math.max(0, end - hold.start)} ms; ` + 
                    `${hold.nonReactingRepeats} repeated keydown(s) did notthing`;
                return (
                    <button
                        key={`hold-${index}`}
                        aria-label={description}
                        className={debugStyles.keyHold}
                        style={{left: `${left}px`, width: `${width}px`}}
                        title={description}
                        type="button"
                    >
                        <span className={debugStyles.keyHoldLabel}>{hold.key}</span>
                    </button>
                );
            })}
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
    timestampEnd: PropTypes.number.isRequired,
    onBroadcastClick: PropTypes.func
};

export default EventsBarRow;
