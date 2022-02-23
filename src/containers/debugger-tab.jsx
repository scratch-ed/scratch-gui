import React from 'react';
import {connect} from 'react-redux';
import DebuggerTabComponent from '../components/debugger-tab/debugger-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';
import {disableAnimation, enableAnimation, setTrailLength} from '../reducers/debugger.js';
import omit from 'lodash.omit';

class DebuggerTab extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleTrailChange',
            'handleTrailMouseDown',
            'handleTrailMouseUp'
        ]);
    }

    handleTrailChange (event) {
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
            'running',
            'vm',
            'disableAnimation',
            'enableAnimation',
            'setTrailLength'
        ]);

        return (
            <DebuggerTabComponent
                {...componentProps}
                onTrailChange={this.handleTrailChange}
                onTrailMouseDown={this.handleTrailMouseDown}
                onTrailMouseUp={this.handleTrailMouseUp}
            />
        );
    }
}

const mapStateToProps = state => ({
    animationSkinId: state.scratchGui.debugger.animationSkinId,
    running: state.scratchGui.vmStatus.running,
    trailLength: state.scratchGui.debugger.trailLength
});

const mapDispatchToProps = dispatch => ({
    disableAnimation: () => dispatch(disableAnimation()),
    enableAnimation: () => dispatch(enableAnimation()),
    setTrailLength: trailLength => dispatch(setTrailLength(trailLength))
});

DebuggerTab.propTypes = {
    animationSkinId: PropTypes.number,
    running: PropTypes.bool.isRequired,
    trailLength: PropTypes.number.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    disableAnimation: PropTypes.func.isRequired,
    enableAnimation: PropTypes.func.isRequired,
    setTrailLength: PropTypes.func.isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DebuggerTab);
