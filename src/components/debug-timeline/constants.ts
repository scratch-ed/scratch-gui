import keycapIcon from '../timeline/keycap.png';
import mouseClickIcon from '../timeline/mouseClick.png';
import broadcastIcon from '../timeline/broadcast.png';
import greenFlagIcon from '../green-flag/icon--green-flag.svg';

export const TRACK_HEIGHT = 80;

export const SUB_BAR_NUM = 4;
export const BAR_WIDTH = 80;

export const EVENT_TYPES = Object.freeze({
    'event_whenflagclicked': {
        name: 'Green Flag',
        icon: greenFlagIcon,
        color: 'green-flag'
    },
    'event_whenkeypressed': {
        name: 'Key Pressed',
        icon: keycapIcon,
        color: 'broadcast'
    },
    'event_whenthisspriteclicked': {
        name: 'Sprite Clicked',
        icon: mouseClickIcon,
        color: 'broadcast'
    },
    'event_whenstageclicked': {
        name: 'Stage Clicked',
        icon: mouseClickIcon,
        color: 'broadcast'
    },
    'event_whenbackdropswitchesto': {
        name: 'Backdrop Switched To',
        icon: '!',
        color: 'broadcast'
    },
    'event_whengreaterthan': {
        name: 'Greater Than',
        icon: '!',
        color: 'broadcast'
    },
    'event_whenbroadcastreceived': {
        name: 'Broadcast Received',
        icon: broadcastIcon,
        color: 'broadcast'
    }
});

export const TRACK_COLORS = [
    'green-flag',
    'broadcast'
];

export const getKeyOnIcon = (key) => {
    switch (key) {
    case ' ':
    case 'SPACE':
        return ' ';
    case 'ArrowLeft':
    case 'LEFT ARROW':
        return '⬅';
    case 'ArrowRight':
    case 'RIGHT ARROW':
        return '➡';
    case 'ArrowUp':
    case 'UP ARROW':
        return '⬆';
    case 'ArrowDown':
    case 'DOWN ARROW':
        return '⬇';
    default:
        return key.toUpperCase();
    }
};

const getCompressedWidth = (timestamp, ticks, size) => {
    if (ticks.length < 2 || timestamp < ticks[0]) return 0;

    let visibleTimeElapsed = 0;

    let spanFound = false;
    let i = 0;
    while (!spanFound && i < ticks.length - 1 && ticks[i] < timestamp) {
        const startCut = ticks[i];
        const endCut = ticks[i + 1];

        if (timestamp >= endCut) {
            visibleTimeElapsed += size;
        } else {
            let timeIntoSpan = 0;
            if ((endCut - startCut) - size < 1e-6) {
                timeIntoSpan = timestamp - startCut;
            } else {
                timeIntoSpan = size / 2;
            }

            visibleTimeElapsed += timeIntoSpan;

            spanFound = true;
        }

        i++;
    }

    return visibleTimeElapsed;
};

export const getCompressedPlotPosition = (timestamp, ticks, size) => {
    if (ticks.length < 2 || timestamp < ticks[0]) return 0;

    const visibleTimeElapsed = getCompressedWidth(timestamp, ticks, size);
    return (visibleTimeElapsed * BAR_WIDTH) / size;
};
