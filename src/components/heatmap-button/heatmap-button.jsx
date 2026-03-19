import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import heatmapIcon from '../heatmap/heatmap.png';
import styles from './heatmap-button.css';

const messages = defineMessages({
    heatmapTitle: {
        id: 'gui.heatmap.toggle',
        defaultMessage: 'Toggle Heatmap',
        description: 'Heatmap button title'
    }
});

const HeatmapButton = function (props) {
    const {active, intl, onClick} = props;
    return (
        <div
            className={styles.heatmapButtonContainer}
        >
            <button
                className={active ? styles.active : styles.inactive}
                title={intl.formatMessage(messages.heatmapTitle)}
                onClick={onClick}
            >
                <img
                    className={styles.heatmapIcon}
                    src={heatmapIcon}
                    alt={intl.formatMessage(messages.heatmapTitle)}
                />
            </button>
        </div>
    );
};

HeatmapButton.propTypes = {
    active: PropTypes.bool,
    intl: intlShape.isRequired,
    onClick: PropTypes.func.isRequired
};

HeatmapButton.defaultProps = {
    active: false
};

export default injectIntl(HeatmapButton);
