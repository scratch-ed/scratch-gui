import React from 'react';
import TimeSliderComponent from '../components/time-slider/time-slider.jsx';
import {runDebugger} from '@ftrprf/judge-core';

// eslint-disable-next-line react/prefer-stateless-function
class TimeSlider extends React.Component {
    // eslint-disable-next-line no-useless-constructor
    constructor (props) {
        super(props);
    }

    handleOnInput () {
        console.log(runDebugger);
    }

    handleOnMouseUp () {

    }

    handleOnMouseDown () {

    }

    render () {
        const {
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

export default TimeSlider;
