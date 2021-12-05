import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import ControlsComponent from '../components/controls/controls.jsx';
import {toggleDebugMode} from '../reducers/debugger.js';

class Controls extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDebugModeClick',
            'handleGreenFlagClick',
            'handleStopAllClick'
        ]);
    }

    handleDebugModeClick (e) {
        e.preventDefault();
        this.props.toggleDebugMode();
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

    handleStopAllClick (e) {
        e.preventDefault();
        this.props.vm.stopAll();
    }

    render () {
        const {
            vm, // eslint-disable-line no-unused-vars
            isStarted, // eslint-disable-line no-unused-vars
            projectRunning,
            toggleDebugMode: toggleDebugModeProp, // eslint-disable-line no-unused-vars
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
            />
        );
    }
}

Controls.propTypes = {
    isStarted: PropTypes.bool.isRequired,
    projectRunning: PropTypes.bool.isRequired,
    toggleDebugMode: PropTypes.func.isRequired,
    turbo: PropTypes.bool.isRequired,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    isStarted: state.scratchGui.vmStatus.running,
    projectRunning: state.scratchGui.vmStatus.running,
    turbo: state.scratchGui.vmStatus.turbo
});

const mapDispatchToProps = dispatch => ({
    toggleDebugMode: () => dispatch(toggleDebugMode())
});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
