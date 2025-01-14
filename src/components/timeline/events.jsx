import React from 'react';
import PropTypes from 'prop-types';

import ReactTooltip from 'react-tooltip';

import keycapIcon from './keycap.png';
import mouseClickIcon from './mouseClick.png';
import broadcastIcon from './broadcast.png';
import greenFlagIcon from '../green-flag/icon--green-flag.svg';
import styles from './timeline.css';

const TooltipContents = ({event}) => {
    const formatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});
    let message;

    if (event.type === 'key') {
        let text;
        switch (event.data.key) {
        case ' ':
        case 'SPACE':
            text = 'Space';
            break;
        case 'ArrowLeft':
        case 'LEFT ARROW':
            text = 'Left Arrow';
            break;
        case 'ArrowRight':
        case 'RIGHT ARROW':
            text = 'Right Arrow';
            break;
        case 'ArrowUp':
        case 'UP ARROW':
            text = 'Up Arrow';
            break;
        case 'ArrowDown':
        case 'DOWN ARROW':
            text = 'Down Arrow';
            break;
        default:
            text = event.data.key.toUpperCase();
        }
        if (event.sprites.length > 0) {
            message = `${formatter.format(event.sprites)} reacted`;
        } else {
            message = `and nothing happened`;
        }
        return (<>
            <div>{`The '${text}' key was pressed`}</div>
            <div>{message}</div>
        </>);
    }

    if (event.type === 'click') {
        if (event.sprites.includes(event.data.target)) {
            message = `and ${event.data.target} reacted`;
        } else {
            message = `and nothing happened`;
        }
        return (<>
            <div>{`Clicked on ${event.data.target}`}</div>
            <div>{message}</div>
        </>);
    }

    if (event.type === 'broadcast') {
        if (event.sprites.length > 0) {
            message = `Broadcast '${event.data.name}' received by ${formatter.format(event.sprites)}`;
        } else {
            message = `Broadcast '${event.data.name}' was sent, but no one received it`;
        }
        return (
            <div>{message}</div>
        );
    }

    if (event.type === 'greenFlag') {
        if (event.sprites.length > 0) {
            message = `${formatter.format(event.sprites)} started`;
        } else {
            message = `...but nothing happened`;
        }
        return (
            <>
                <div>{'Green flag was clicked'}</div>
                <div>{message}</div>
            </>
        );
    }

    return null;
};

TooltipContents.propTypes = {
    event: PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    })
};


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

const Events = ({events, timeElapsed, setFrameRange, clearHighlighting, highlightFrameRange}) => (
    <div className={styles.flexRow}>
        {
            events.map((event, index) => (
                <div
                    key={index}
                    className={styles.timelineItem}
                    style={{left: `${event.timestamp / timeElapsed * 100}%`}}
                >
                    <div
                        className={styles.eventIcon}
                        data-for={`event-${index}`}
                        data-tip=""
                        onClick={() => setFrameRange(event.begin, event.end)}
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
    timeElapsed: PropTypes.number,
    setFrameRange: PropTypes.func,
    clearHighlighting: PropTypes.func,
    highlightFrameRange: PropTypes.func
};

export default Events;
