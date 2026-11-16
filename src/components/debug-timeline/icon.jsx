import React from 'react';
import PropTypes from 'prop-types';
import styles from './debug-timeline.css';
import {getKeyOnIcon} from './helpers.ts';
import {EVENT_TYPES, EVENTS_TO_ICON} from './constants.ts';

/**
 * Render a timeline event or category icon, optionally using inline markup.
 * @param {object} props The event or category and rendering options.
 * @returns {JSX.Element} The icon and any key overlay.
 */
const Icon = ({
    event,
    category,
    isEvent,
    inline
}) => {
    let key;
    let icon;
    const Container = inline ? 'span' : 'div';
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
        <Container className={styles.iconContainer}>
            <img
                alt="Icon of event"
                className={styles.eventIcon}
                draggable={false}
                src={icon}
            />
            {key &&
                <Container className={styles.eventKeyData}>
                    <span>{getKeyOnIcon(key)}</span>
                </Container>
            }
        </Container>
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
    isEvent: PropTypes.bool.isRequired,
    inline: PropTypes.bool
};

export default Icon;
