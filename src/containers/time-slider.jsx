import React from 'react';
import TimeSliderComponent from '../components/time-slider/time-slider.jsx';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

class TimeSlider extends React.Component {
    handleOnInput () {

    }

    handleOnMouseUp () {

    }

    handleOnMouseDown () {

    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            ...props
        } = this.props;
        return (
            <TimeSliderComponent
                {...props}
                onInput={this.handleOnInput}
                onMouseUp={this.handleOnMouseUp}
                onMouseDown={this.handleOnMouseDown}
            />
        );
    }
}

TimeSlider.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default TimeSlider;
