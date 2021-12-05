import React from 'react';
import {connect} from 'react-redux';
import DebuggerTabComponent from '../components/debugger-tab/debugger-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';
import {
    disableAnimation,
    enableAnimation,
    setTimeFrame,
    setTrailLength,
    toggleDebugMode
} from '../reducers/debugger.js';
import omit from 'lodash.omit';

class DebuggerTab extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleClickRun',
            'handleClickStep',
            'handleTimeInput',
            'handleTimeMouseDown',
            'handleTimeMouseUp',
            'handleToggle',
            'handleTrailInput',
            'handleTrailMouseDown',
            'handleTrailMouseUp'
        ]);
    }

    handleClickRun () {

    }

    handleClickStep () {

    }

    handleTimeInput (event) {
        this.props.setTimeFrame(parseInt(event.target.value, 10));
    }

    handleTimeMouseDown () {
        if (!this.props.running) {
            this.props.disableAnimation();
            this.props.vm.renderer.penClear(this.props.animationSkinId);
        }
    }

    handleTimeMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    handleToggle () {
        this.props.toggleDebugMode();
    }

    handleTrailInput (event) {
        this.props.setTrailLength(parseInt(event.target.value, 10));
    }

    handleTrailMouseDown () {
        if (!this.props.running) {
            this.props.disableAnimation();
            this.props.vm.renderer.penClear(this.props.animationSkinId);
        }
    }

    handleTrailMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    render () {
        const componentProps = omit(this.props, [
            'animationSkinId',
            'vm',
            'disableAnimation',
            'enableAnimation',
            'setTimeFrame',
            'setTrailLength',
            'toggleDebugMode'
        ]);

        return (
            <DebuggerTabComponent
                {...componentProps}
                onClickRun={this.handleClickRun}
                onClickStep={this.handleClickStep}
                onTimeChange={this.handleTimeInput}
                onTimeMouseDown={this.handleTimeMouseDown}
                onTimeMouseUp={this.handleTimeMouseUp}
                onToggle={this.handleToggle}
                onTrailChange={this.handleTrailInput}
                onTrailMouseDown={this.handleTrailMouseDown}
                onTrailMouseUp={this.handleTrailMouseUp}
            />
        );
    }
}

const mapStateToProps = state => ({
    animationSkinId: state.scratchGui.debugger.animationSkinId,
    debugMode: state.scratchGui.debugger.debugMode,
    numberOfFrames: state.scratchGui.debugger.numberOfFrames,
    running: state.scratchGui.vmStatus.running,
    timeFrame: state.scratchGui.debugger.timeFrame,
    trailLength: state.scratchGui.debugger.trailLength
});

const mapDispatchToProps = dispatch => ({
    disableAnimation: () => dispatch(disableAnimation()),
    enableAnimation: () => dispatch(enableAnimation()),
    setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
    setTrailLength: trailLength => dispatch(setTrailLength(trailLength)),
    toggleDebugMode: () => dispatch(toggleDebugMode())
});

DebuggerTab.propTypes = {
    animationSkinId: PropTypes.number,
    debugMode: PropTypes.bool.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    running: PropTypes.bool.isRequired,
    timeFrame: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    disableAnimation: PropTypes.func.isRequired,
    enableAnimation: PropTypes.func.isRequired,
    setTimeFrame: PropTypes.func.isRequired,
    setTrailLength: PropTypes.func.isRequired,
    toggleDebugMode: PropTypes.func.isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DebuggerTab);
