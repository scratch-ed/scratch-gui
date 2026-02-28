import React from 'react';
import PropTypes from 'prop-types';
import styles from "../timeline/timeline.css";
import Icon from "./icon.jsx";
import ReactTooltip from "react-tooltip";
import TooltipContents from "../timeline/tooltip.jsx";

const Event = ({
    index,
    activeTargetName,
    position,
    event,
    transparent
}) => {
    const affectsTarget = event.sprites.includes(activeTargetName);

    const backgroundColor = transparent ? 'transparent' : affectsTarget ? 'rgba(126, 206, 126, 0.5)' : 'rgba(255, 107, 107, 0.5)';
    const randomId = Math.floor(Math.random() * 1000);

    return (
        <div>
            <div
                className={styles.tooltipData}

                data-for={`event-${index}-${randomId}`}
                data-tip=""
                style={{
                    left: `${position}px`
                }}
            >
                <div
                    className={styles.eventIconContainer}
                    style={{backgroundColor: backgroundColor}}
                >
                    <Icon
                        event={event}
                        isEvent={true}
                    />
                </div>
            </div>
            <ReactTooltip
                id={`event-${index}-${randomId}`}
                className={styles.tooltip}
                effect="solid"
                place="left"
            >
                <TooltipContents event={event} />
            </ReactTooltip>
        </div>
    );
};

Event.propTypes = {
    index: PropTypes.number.isRequired,
    activeTargetName: PropTypes.string.isRequired,
    position: PropTypes.number.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    event: PropTypes.object.isRequired,
    transparent: PropTypes.bool.isRequired
};

export default Event;
