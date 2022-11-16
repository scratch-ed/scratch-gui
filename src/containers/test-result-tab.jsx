import React from 'react';
import {connect} from 'react-redux';
import TestResultTabComponent from '../components/test-result-tab/test-result-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';
import {disableAnimation, enableAnimation, setTrailLength} from '../reducers/debugger.js';
import omit from 'lodash.omit';

class TestResultTab extends React.Component {
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
        }
    }

    handleTrailMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    render () {
        const componentProps = omit(this.props, [
            'running',
            'vm',
            'disableAnimation',
            'enableAnimation',
            'setTrailLength'
        ]);

        return (
            <TestResultTabComponent
                {...componentProps}
                onTrailChange={this.handleTrailChange}
                onTrailMouseDown={this.handleTrailMouseDown}
                onTrailMouseUp={this.handleTrailMouseUp}
            />
        );
    }
}

const mapStateToProps = state => ({
    running: state.scratchGui.vmStatus.running,
    trailLength: state.scratchGui.debugger.trailLength
});

const mapDispatchToProps = dispatch => ({
    disableAnimation: () => dispatch(disableAnimation()),
    enableAnimation: () => dispatch(enableAnimation()),
    setTrailLength: trailLength => dispatch(setTrailLength(trailLength))
});

TestResultTab.propTypes = {
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
)(TestResultTab);
