import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';

import TooltipContents from './tooltip.jsx';

import keycapIcon from './keycap.png';
import mouseClickIcon from './mouseClick.png';
import broadcastIcon from './broadcast.png';
import greenFlagIcon from '../green-flag/icon--green-flag.svg';
import styles from './timeline.css';

const EventMarker = ({event}) => {
    if (event.type === 'key') {
        let key;
        switch (event.data.key) {
        case ' ':
        case 'SPACE':
            key = ' ';
            break;
        case 'ArrowLeft':
        case 'LEFT ARROW':
            key = '⬅';
            break;
        case 'ArrowRight':
        case 'RIGHT ARROW':
            key = '➡';
            break;
        case 'ArrowUp':
        case 'UP ARROW':
            key = '⬆';
            break;
        case 'ArrowDown':
        case 'DOWN ARROW':
            key = '⬇';
            break;
        default:
            key = event.data.key.toUpperCase();
        }
        return (
            <>
                <img
                    className={styles.eventIcon}
                    draggable={false}
                    src={keycapIcon}
                />
                <div
                    className={styles.eventKeyData}
                >
                    {key}
                </div>
            </>
        );
    }

    if (event.type === 'click') {
        return (
            <img
                className={styles.eventIcon}
                draggable={false}
                src={mouseClickIcon}
            />
        );
    }

    if (event.type === 'broadcast') {
        return (
            <img
                className={styles.eventIcon}
                draggable={false}
                src={broadcastIcon}
            />
        );
    }

    if (event.type === 'greenFlag') {
        return (
            <img
                className={styles.eventIcon}
                draggable={false}
                src={greenFlagIcon}
            />
        );
    }

    return null;
};

EventMarker.propTypes = {
    event: PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    })
};

const shownEventTypes = ['click', 'key', 'broadcast', 'greenFlag'];

const Events = ({events, mapTime, setFrameRange, clearHighlighting, highlightFrameRange, onBroadcastClick}) => (
    <div className={classNames(styles.flexRow, styles.rowMargin)}>
        {
            events.filter(e => shownEventTypes.includes(e.type)).map((event, index) => (
                <div
                    key={index}
                    className={styles.timelineItem}
                    style={{left: `${mapTime(event.timestamp)}%`}}
                >
                    <div
                        className={styles.eventIcon}
                        data-for={`event-${index}`}
                        data-tip=""
                        onClick={() => {
                            if (event.type === 'broadcast' && onBroadcastClick) {
                                onBroadcastClick(event);
                            }
                            setFrameRange(event.begin, event.end);
                        }}
                        onMouseEnter={() => highlightFrameRange(event.begin, event.end)}
                        onMouseLeave={clearHighlighting}
                    >
                        <EventMarker event={event} />
                    </div>
                    <ReactTooltip
                        className={styles.tooltip}
                        effect="solid"
                        id={`event-${index}`}
                        place="left"
                    >
                        <TooltipContents event={event} />
                    </ReactTooltip>
                </div>
            ))
        }
    </div>
);

Events.propTypes = {
    events: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    })),
    mapTime: PropTypes.func,
    setFrameRange: PropTypes.func,
    clearHighlighting: PropTypes.func,
    highlightFrameRange: PropTypes.func,
    onBroadcastClick: PropTypes.func
};

export default Events;
