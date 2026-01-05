import React from 'react';
import PropTypes from 'prop-types';
import styles from './debug-timeline.css';
import {getKeyOnIcon} from './helpers.ts';
import {EVENT_TYPES, EVENTS_TO_ICON} from './constants.ts';

const Icon = ({
    event,
    category,
    isEvent
}) => {
    let key;
    let icon;
    if (isEvent) {
        icon = EVENTS_TO_ICON[event.type];
        if (event.type === 'key') {
            key = event.data.key;
        }
    } else {
        icon = category.icon;
        if (category.id === EVENT_TYPES.KEY) {
            key = category.options.key.value;
        }
    }

    return (
        <div style={{position: 'relative'}}>
            <img
                alt="Icon of event"
                className={styles.eventIcon}
                draggable={false}
                src={icon}
            />
            {key &&
                <div className={styles.eventKeyData}>
                    <span>{getKeyOnIcon(key)}</span>
                </div>
            }
        </div>
    );
};

Icon.propTypes = {
    event: PropTypes.shape({
        type: PropTypes.string,
        // eslint-disable-next-line react/forbid-prop-types
        data: PropTypes.object,
        begin: PropTypes.number,
        end: PropTypes.number,
        sprites: PropTypes.arrayOf(PropTypes.string)
    }),
    category: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        // eslint-disable-next-line react/forbid-prop-types
        options: PropTypes.object.isRequired
    }),
    isEvent: PropTypes.bool.isRequired
};

export default Icon;
