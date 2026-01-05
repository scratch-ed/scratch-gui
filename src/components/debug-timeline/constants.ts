import keycapIcon from '../timeline/keycap.png';
import mouseClickIcon from '../timeline/mouseClick.png';
import broadcastIcon from '../timeline/broadcast.png';
import backdropIcon2 from '../timeline/backdrop2.png';
import isGreaterThanIcon from '../timeline/is-greater-than.png';
import greenFlagIcon from '../green-flag/icon--green-flag.svg';
import calendarIcon from '../timeline/calendar.png';

export const TRACK_HEIGHT = 80;

export const SUB_BAR_NUM = 4;
export const BAR_WIDTH = 80;

export const EVENT_TYPES = Object.freeze({
    EVENTS: 0,
    FLAG: 1,
    KEY: 2,
    SPRITE_CLICKED: 3,
    STAGE_CLICKED: 4,
    BACKDROP_SWITCHED: 5,
    GREATER_THAN: 6,
    BROADCAST: 7
});

export const EVENT_INFO = Object.freeze({
    events: {
        id: EVENT_TYPES.EVENTS,
        name: 'Events',
        icon: calendarIcon,
        color: 'events'
    },
    event_whenflagclicked: {
        id: EVENT_TYPES.FLAG,
        name: 'Green flag',
        icon: greenFlagIcon,
        color: 'green-flag'
    },
    event_whenkeypressed: {
        id: EVENT_TYPES.KEY,
        name: 'Key pressed',
        icon: keycapIcon,
        color: 'broadcast'
    },
    event_whenthisspriteclicked: {
        id: EVENT_TYPES.SPRITE_CLICKED,
        name: 'Sprite clicked',
        icon: mouseClickIcon,
        color: 'broadcast'
    },
    event_whenstageclicked: {
        id: EVENT_TYPES.STAGE_CLICKED,
        name: 'Stage clicked',
        icon: mouseClickIcon,
        color: 'broadcast'
    },
    event_whenbackdropswitchesto: {
        id: EVENT_TYPES.BACKDROP_SWITCHED,
        name: 'Backdrop switched to',
        icon: backdropIcon2,
        color: 'broadcast'
    },
    event_whengreaterthan: {
        id: EVENT_TYPES.GREATER_THAN,
        name: 'Greater than',
        icon: isGreaterThanIcon,
        color: 'broadcast'
    },
    event_whenbroadcastreceived: {
        id: EVENT_TYPES.BROADCAST,
        name: 'Broadcast received: ',
        icon: broadcastIcon,
        color: 'broadcast'
    }
});

export const EVENTS_TO_ICON = Object.freeze({
    key: keycapIcon,
    click: mouseClickIcon,
    broadcast: broadcastIcon,
    greenFlag: greenFlagIcon,
    greaterThan: isGreaterThanIcon,
    backdrop: backdropIcon2
});
