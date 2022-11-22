import React from 'react';
import PropTypes from 'prop-types';

import Box from '../box/box.jsx';

import styles from './test-result-tab.css';
import {FormattedMessage} from 'react-intl';

const TestResultTabComponent = function (props) {
    const {
        getTestResults
    } = props;

    return (
        <Box className={styles.debuggerTab}>
            <label>
                <span>
                    <FormattedMessage
                        defaultMessage="Test Results"
                        description="head of test result tab"
                        id="gui.testResultTab.header"
                    />
                </span>
                <br />
                <span>
                    { // TODO: make test result component
                        getTestResults().map((result, i) => <div key={i}>{result}<br /></div>)
                    }
                </span>
            </label>
        </Box>
    );
};

TestResultTabComponent.propTypes = {
    getTestResults: PropTypes.func.isRequired
};

export default TestResultTabComponent;
