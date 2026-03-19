import React from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import styles from './heatmap-intensity-slider.css';

const messages = defineMessages({
    intensityLabel: {
        id: 'gui.heatmapIntensitySlider.intensityLabel',
        defaultMessage: 'Intensity',
        description: 'Label for heatmap intensity slider'
    }
});

const HeatmapIntensitySlider = ({ intensity, onIntensityChange, intl }) => {
    return (
        <div className={styles.container}>
            <label className={styles.label}>
                {intl.formatMessage(messages.intensityLabel)}
            </label>
            <input
                className={styles.slider}
                type="range"
                min="1"
                max="100"
                value={intensity}
                onChange={(e) => onIntensityChange(parseInt(e.target.value, 10))}
            />
            <span className={styles.value}>{intensity}</span>
        </div>
    );
};

HeatmapIntensitySlider.propTypes = {
    intensity: PropTypes.number.isRequired,
    onIntensityChange: PropTypes.func.isRequired,
    intl: intlShape.isRequired
};

export default injectIntl(HeatmapIntensitySlider);
