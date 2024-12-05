import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {TimeSliderMode, TimeSliderStates, closeSlider} from '../reducers/time-slider.js';

import ControlsComponent from '../components/controls/controls.jsx';

class Controls extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleDebugModeClick',
            'handleGreenFlagClick',
            'handleStopAllClick',
            'handleTestFlagClick'
        ]);
    }

    handleDebugModeClick (e) {
        e.preventDefault();

        if (this.props.timeSliderMode === TimeSliderMode.DEBUG) {
            this.props.vm.runtime.disableDebugMode();
        } else {
            this.props.vm.runtime.enableDebugMode();
        }
    }

    handleGreenFlagClick (e) {
        e.preventDefault();
        if (e.shiftKey) {
            this.props.vm.setTurboMode(!this.props.turbo);
        } else {
            if (!this.props.isStarted) {
                this.props.vm.start();
            }
            this.props.vm.greenFlag();
        }
    }

    handleTestFlagClick (e) {
        e.preventDefault();
        if (this.props.timeSliderMode === TimeSliderMode.TEST_RUNNING) {
            this.props.vm.runtime.stopTesting();
        } else {
            this.props.vm.runtime.startTesting();
        }
    }

    handleStopAllClick (e) {
        e.preventDefault();

        if (this.props.timeSliderMode === TimeSliderMode.TEST_RUNNING) {
            this.props.vm.runtime.stopTesting();
        } else if (this.props.timeSliderMode === TimeSliderMode.TEST_FINISHED) {
            this.props.vm.runtime.disableTestMode();
        } else {
            this.props.vm.stopAll();
        }
    }

    render () {
        const componentProps = omit(this.props, [
            'vm',
            'projectRunning',
            'turbo',
            'testsLoaded',
            'closeSlider'
        ]);

        return (
            <ControlsComponent
                {...componentProps}
                active={this.props.projectRunning}
                turbo={this.props.turbo}
                testsLoaded={this.props.testsLoaded}
                onDebugModeClick={this.handleDebugModeClick}
                onGreenFlagClick={this.handleGreenFlagClick}
                onStopAllClick={this.handleStopAllClick}
                onTestFlagClick={this.handleTestFlagClick}
            />
        );
    }
}

Controls.propTypes = {
    timeSliderMode: PropTypes.oneOf(TimeSliderStates).isRequired,
    closeSlider: PropTypes.func.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    testsLoaded: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM),
    isStarted: PropTypes.bool
};

const mapStateToProps = state => ({
    timeSliderMode: state.scratchGui.timeSlider.timeSliderMode,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo,
    testsLoaded: state.scratchGui.vmStatus.testsLoaded
});

const mapDispatchToProps = dispatch => ({
    closeSlider: () => dispatch(closeSlider())
});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
