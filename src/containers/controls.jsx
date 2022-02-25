import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import ControlsComponent from '../components/controls/controls.jsx';

class Controls extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleDebugModeClick',
            'handleGreenFlagClick',
            'handlePauseClick',
            'handleResumeClick',
            'handleStepClick',
            'handleStopAllClick'
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

    handlePauseClick (e) {
        e.preventDefault();
        if (this.props.projectRunning && !this.props.paused) {
            this.props.vm.runtime.pause();
        }
    }

    handleResumeClick (e) {
        e.preventDefault();
        if (this.props.projectRunning && this.props.paused) {
            this.props.vm.runtime.resume();
        }
    }

    handleStepClick (e) {
        e.preventDefault();
        if (this.props.projectRunning && this.props.paused) {
            this.props.vm.runtime.step();
        }
    }

    handleStopAllClick (e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            isStarted, // eslint-disable-line no-unused-vars
            projectRunning,
            turbo,
            ...props
        } = this.props;

        return (
            <ControlsComponent
                {...props}
                active={projectRunning}
                turbo={turbo}
                onDebugModeClick={this.handleDebugModeClick}
                onGreenFlagClick={this.handleGreenFlagClick}
                onPauseClick={this.handlePauseClick}
                onResumeClick={this.handleResumeClick}
                onStepClick={this.handleStepClick}
                onStopAllClick={this.handleStopAllClick}
            />
        );
    }
}

Controls.propTypes = {
    debugMode: PropTypes.bool.isRequired,
    isStarted: PropTypes.bool.isRequired,
    paused: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    debugMode: state.scratchGui.debugger.debugMode,
    isStarted: state.scratchGui.vmStatus.running,
    paused: state.scratchGui.debugger.paused,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo
});

// no-op function to prevent dispatch prop being passed to component
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
