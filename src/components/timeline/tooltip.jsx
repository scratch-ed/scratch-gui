import PropTypes from "prop-types";
import React from "react";

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
            message = `${formatter.format([...new Set(event.sprites)])} reacted`;
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

export default TooltipContents;
