import React from 'react';
import TestResultTabComponent from '../components/test-result-tab/test-result-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

class TestResultTab extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'getTestResults'
        ]);
    }

    getTestResults () {
        return this.props.vm.runtime.getTestResults();
    }

    render () {
        return (
            <TestResultTabComponent
                getTestResults={this.getTestResults}
            />
        );
    }
}


TestResultTab.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default TestResultTab;
