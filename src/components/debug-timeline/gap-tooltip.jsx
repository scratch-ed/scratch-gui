import React from 'react';
import PropTypes from 'prop-types';
import Icon from "./icon.jsx";
import styles from './debug-timeline.css';

const GapTooltip = ({gapGroup}) => {
    const {left, events} = gapGroup;
    const maxToShow = 15;

    const eventsByTypeAndKey = events.reduce((acc, event) => {
        const key = event.data?.key || 'none';
        const uniqueKey = `${event.type}:${key}`;

        if (!acc[uniqueKey]) {
            acc[uniqueKey] = {
                count: 0,
                sampleEvent: event,
                key: uniqueKey
            };
        }

        acc[uniqueKey].count++;
        return acc;
    }, {});

    const allValues = Object.values(eventsByTypeAndKey);
    const displayValues = allValues.slice(0, maxToShow);
    const hasMore = allValues.length > maxToShow;
    const remainingCount = allValues.length - maxToShow;

    return (
        <div>
            <div style={{fontWeight: 'bold', marginBottom: '8px'}}>
                There are {events.length} events in this gap:
            </div>
            {displayValues.map(({count, sampleEvent, key}) => (
                <div key={`${key}`} className={styles.gapTooltip}>
                    <div>
                        <Icon
                            event={sampleEvent}
                            isEvent={true}
                        />
                    </div>
                    <span style={{marginLeft: '8px', fontWeight: 'bold'}}>
                        {count} time{count === 1 ? '' : 's'}
                    </span>
                </div>
            ))}
            {hasMore && (
                <div className={styles.gapTooltipRemaining}>
                    ... and {remainingCount} more event type{remainingCount === 1 ? '' : 's'} not displayed
                </div>
            )}
        </div>
    );
};

GapTooltip.propTypes = {
    gapGroup: PropTypes.shape({
        left: PropTypes.number.isRequired,
        events: PropTypes.arrayOf(PropTypes.object).isRequired
    }).isRequired
};

export default GapTooltip;
