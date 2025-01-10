import React from 'react';
import PropTypes from 'prop-types';

import ReactTooltip from 'react-tooltip';

import classNames from 'classnames';

import keycapIcon from './keycap.png';
import broadcastIcon from './broadcast.png';
import mouseClickIcon from './mouseClick.png';
import styles from './timeline.css';

const keyEventSeenMessage = (event, formatter) => {
    if (event.sprites.length > 0) {
        return `${formatter.format(event.sprites)} reacted`;
    }
    return `...but nothing happened`;
};

const clickEventSeenMessage = event => {
    if (event.sprites.includes(event.data.target)) {
        return `and ${event.data.target} reacted`;
    }
    return `...but nothing happened`;
};

const EventMarker = ({event, index, tickSize}) => {
    const formatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});

    if (event.type === 'key') {
        let key;
        let text;
        switch (event.data.key) {
        case ' ':
        case 'SPACE':
            key = ' ';
            text = 'Space';
            break;
        case 'ArrowLeft':
        case 'LEFT ARROW':
            key = '⬅';
            text = 'Left Arrow';
            break;
        case 'ArrowRight':
        case 'RIGHT ARROW':
            key = '➡';
            text = 'Right Arrow';
            break;
        case 'ArrowUp':
        case 'UP ARROW':
            key = '⬆';
            text = 'Up Arrow';
            break;
        case 'ArrowDown':
        case 'DOWN ARROW':
            key = '⬇';
            text = 'Down Arrow';
            break;
        default:
            key = event.data.key.toUpperCase();
            text = event.data.key.toUpperCase();
        }
        return (
            <>
                <div
                    data-for={`keypress-${index}`}
                    data-tip=""
                >
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
                </div>
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`keypress-${index}`}
                    place="top"
                >
                    <div>{`The '${text}' key was pressed`}</div>
                    <div>{keyEventSeenMessage(event, formatter)}</div>
                </ReactTooltip>
                {
                    // <div
                    //     style={{width: `${(event.end - event.begin) * 100 / tickSize}px`, height: '5px', background: 'grey',
                    //         borderRadius: '3px', transform: 'translatey(-15px)'}}
                    //     data-for={`keypress-${index}`}
                    //     data-tip=""
                    // />
                }
            </>
        );
    }
    if (event.type === 'click') {
        return (
            <>
                <img
                    className={styles.eventIcon}
                    draggable={false}
                    src={mouseClickIcon}
                    data-for={`mouseClick-${index}`}
                    data-tip=""
                />
                <ReactTooltip
                    className={styles.tooltip}
                    effect="solid"
                    id={`mouseClick-${index}`}
                    place="top"
                >
                    <div>{`Clicked on ${event.data.target}`}</div>
                    <div>{clickEventSeenMessage(event)}</div>
                </ReactTooltip>
            </>
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
    }),
    index: PropTypes.number,
    tickSize: PropTypes.number
};

const broadcastMessage = (event, formatter) => {
    if (event.sprites.length > 0) {
        return `Broadcast '${event.data.name}' received by ${formatter.format(event.sprites)}`;
    }
    return `Broadcast '${event.data.name}' was sent, but no one was there to receive it`;
};

const Events = ({events, timeElapsed, tickSize}) => {
    const formatter = new Intl.ListFormat('en', {style: 'long', type: 'conjunction'});

    const clickAndKeyEvents = events.filter(e => e.type === 'key' || e.type === 'click');
    const broadcastEvents = events.filter(e => e.type === 'broadcast');

    return (
        <>
            <div className={classNames(styles.flexRow)}>
                {
                    clickAndKeyEvents.map((event, index) => (
                        <div
                            key={index}
                            className={styles.timelineItem}
                            style={{left: `${event.timestamp / timeElapsed * 100}%`}}
                        >
                            <EventMarker
                                event={event}
                                index={index}
                                tickSize={tickSize}
                            />
                        </div>
                    ))
                }
            </div>
            <div className={classNames(styles.flexRow)}>
                {
                    broadcastEvents.map((event, index) => (
                        <div
                            key={index}
                            className={styles.timelineItem}
                            style={{left: `${event.timestamp / timeElapsed * 100}%`}}
                        >
                            <div
                                data-for={`broadcast-${index}`}
                                data-tip=""
                            >
                                <img
                                    className={styles.eventIcon}
                                    draggable={false}
                                    src={broadcastIcon}
                                />
                            </div>
                            <ReactTooltip
                                className={styles.tooltip}
                                effect="solid"
                                id={`broadcast-${index}`}
                                place="top"
                            >
                                {broadcastMessage(event, formatter)}
                            </ReactTooltip>
                        </div>
                    ))
                }
            </div>
        </>
    );
};

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
    tickSize: PropTypes.number
};

export default Events;
