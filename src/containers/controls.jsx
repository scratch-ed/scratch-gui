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
            'handleRewindModeClick',
            'handleStepClick',
            'handleStopAllClick'
        ]);
    }

    handleDebugModeClick (e) {
        e.preventDefault();

        this.props.vm.stopAll();

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
            if (this.props.rewindMode) {
                return;
            }

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

    handleRewindModeClick (e) {
        e.preventDefault();

        if (this.props.numberOfFrames > 0) {
            this.props.vm.stopAll();

            if (this.props.rewindMode) {
                this.props.vm.runtime.disableRewindMode();
            } else {
                this.props.vm.runtime.enableRewindMode();
            }
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
        if (this.props.rewindMode) {
            return;
        }

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
                onRewindModeClick={this.handleRewindModeClick}
                onStepClick={this.handleStepClick}
                onStopAllClick={this.handleStopAllClick}
            />
        );
    }
}

Controls.propTypes = {
    debugMode: PropTypes.bool.isRequired,
    isStarted: PropTypes.bool.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    paused: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    rewindMode: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    debugMode: state.scratchGui.debugger.debugMode,
    isStarted: state.scratchGui.vmStatus.running,
    numberOfFrames: state.scratchGui.debugger.numberOfFrames,
    paused: state.scratchGui.debugger.paused,
    projectRunning: state.scratchGui.vmStatus.running,
    rewindMode: state.scratchGui.debugger.rewindMode,
    turbo: state.scratchGui.vmStatus.turbo
});

// no-op function to prevent dispatch prop being passed to component
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
