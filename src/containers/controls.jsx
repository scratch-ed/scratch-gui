import bindAll from 'lodash.bindall';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {
    setTestMode
} from '../reducers/time-slider.js';

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

        if (this.props.debugMode) {
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
        this.props.vm.runtime.startTesting();
    }

    handleStopAllClick (e) {
        e.preventDefault();

        if (this.props.testMode) {
            this.props.vm.runtime.stopTesting();
            this.props.setTestMode(false);
        }
        this.props.vm.stopAll();
    }

    render () {
        const componentProps = omit(this.props, [
            'vm',
            'projectRunning',
            'turbo',
            'setTestMode'
        ]);

        return (
            <ControlsComponent
                {...componentProps}
                active={this.props.projectRunning}
                turbo={this.props.turbo}
                onDebugModeClick={this.handleDebugModeClick}
                onGreenFlagClick={this.handleGreenFlagClick}
                onStopAllClick={this.handleStopAllClick}
                onTestFlagClick={this.handleTestFlagClick}
            />
        );
    }
}

Controls.propTypes = {
    debugMode: PropTypes.bool.isRequired,
    testsRunning: PropTypes.bool.isRequired,
    testMode: PropTypes.bool.isRequired,
    setTestMode: PropTypes.func.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM),
    isStarted: PropTypes.bool
};

const mapStateToProps = state => ({
    debugMode: state.scratchGui.timeSlider.debugMode,
    testMode: state.scratchGui.timeSlider.testMode,
    testsRunning: state.scratchGui.vm.runtime.testMode,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo
});

const mapDispatchToProps = dispatch => ({
    setTestMode: testMode => dispatch(setTestMode(testMode))
});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
