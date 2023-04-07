import React from 'react';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {disableAnimation, enableAnimation, setTimeFrame, setNumberOfFrames} from '../reducers/debugger.js';
import TimeInterfaceComponent from '../components/time-interface/time-interface.jsx';
import omit from 'lodash.omit';

class TimeInterface extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleTimeChange',
            'handleTimeMouseDown',
            'handleTimeMouseUp',
            'handleToggleResumeClick',
            'handleStepBackClick',
            'handleStepClick'
        ]);
    }

    handleTimeChange (event) {
        this.props.setTimeFrame(parseInt(event.target.value, 10));
    }

    handleTimeMouseDown () {
        if (!this.props.running) {
            this.props.disableAnimation();
        }
        if (!this.props.paused) {
            this.props.vm.runtime.pause();
        }
    }

    handleTimeMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    handleToggleResumeClick (e) {
        e.preventDefault();
        if (this.props.paused) {
            this.props.setNumberOfFrames(this.props.timeFrame + 1);
            this.props.vm.runtime.resume();
        } else {
            this.props.vm.runtime.pause();
        }
    }

    handleStepBackClick (e) {
        e.preventDefault();
        if (this.props.timeFrame > 0) {
            if (!this.props.paused) {
                this.props.vm.runtime.pause();
            }
            this.props.setTimeFrame(this.props.timeFrame - 1);
        }
    }

    handleStepClick (e) {
        e.preventDefault();
        this.props.setNumberOfFrames(this.props.timeFrame + 1);
        this.props.vm.runtime.step();
    }

    render () {
        const componentProps = omit(this.props, [
            'vm',
            'disableAnimation',
            'enableAnimation',
            'setTimeFrame',
            'setNumberOfFrames'
        ]);

        return (
            <TimeInterfaceComponent
                {...componentProps}
                onTimeChange={this.handleTimeChange}
                onTimeMouseDown={this.handleTimeMouseDown}
                onTimeMouseUp={this.handleTimeMouseUp}
                onToggleResumeClick={this.handleToggleResumeClick}
                onStepBackClick={this.handleStepBackClick}
                onStepClick={this.handleStepClick}
            />
        );
    }

}

const mapStateToProps = state => ({
    numberOfFrames: state.scratchGui.debugger.numberOfFrames,
    running: state.scratchGui.vmStatus.running,
    timeFrame: state.scratchGui.debugger.timeFrame,
    paused: state.scratchGui.debugger.paused,
    changed: state.scratchGui.debugger.changed
});

const mapDispatchToProps = dispatch => ({
    disableAnimation: () => dispatch(disableAnimation()),
    enableAnimation: () => dispatch(enableAnimation()),
    setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
    setNumberOfFrames: timeFrame => dispatch(setNumberOfFrames(timeFrame))
});

TimeInterface.propTypes = {
    numberOfFrames: PropTypes.number.isRequired,
    running: PropTypes.bool.isRequired,
    timeFrame: PropTypes.number.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    disableAnimation: PropTypes.func.isRequired,
    enableAnimation: PropTypes.func.isRequired,
    setTimeFrame: PropTypes.func.isRequired,
    setNumberOfFrames: PropTypes.func.isRequired,
    paused: PropTypes.bool.isRequired,
    changed: PropTypes.bool.isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TimeInterface);
