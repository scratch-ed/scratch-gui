import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {runInVM} from 'itch';

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
        runInVM({
            ...this.props.vm.testConfig,
            template: this.props.vm.testTemplate,
            callback: this.props.testCallback
        }, this.props.vm);
    }

    handleStopAllClick (e) {
        e.preventDefault();

        this.props.vm.stopAll();
    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
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
                onStopAllClick={this.handleStopAllClick}
                onTestFlagClick={this.handleTestFlagClick}
            />
        );
    }
}

Controls.propTypes = {
    debugMode: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM),
    testCallback: PropTypes.func,
    isStarted: PropTypes.bool
};

const mapStateToProps = state => ({
    debugMode: state.scratchGui.debugger.debugMode,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo,
    testCallback: state.scratchGui.vm.processTestFeedback.bind(state.scratchGui.vm)
});

// no-op function to prevent dispatch prop being passed to component
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
