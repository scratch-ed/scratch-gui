import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {runInVM, snapshotFromVm} from 'itch';
import TestResultComponent from '../components/test-results/test-results.jsx';
import {connect} from 'react-redux';
import {VM} from 'scratch-vm';

const TestTab = ({vm, getTestResults, testCallback}) => {
    const config = vm.testConfig;
    const template = vm.testTemplate;
    const testPlan = vm.testPlan;
    const [testFailed, setTestFailed] = useState(false);

    const handleUpload = async () => {
        if (config) {
            const script = document.createElement('script');
            script.className = 'test-script';
            script.type = 'text/javascript';
            script.async = false;
            script.innerHTML = testPlan;
            document.head.appendChild(script);

            const callback = testCallback;

            try {
                await runInVM({
                    ...config,
                    template,
                    callback
                }, vm);
            } catch (error) {
                if (error.name === 'TypeError' && error.message === 'runtime.getSpriteTargetByName(...) is undefined') {
                    setTestFailed(true);
                } else {
                    console.error(error);
                }
            } finally {
                document.head.removeChild(script);
            }
        }
    };

    return (
        <div>
            <button
                onClick={handleUpload}
                className="submit"
            >{'Run tests'}</button>

            {testFailed && (
                <span>{'Sprites in submission don\'t match sprites in template'}</span>
            )}
            <div><TestResultComponent testResults={getTestResults()} /></div>
        </div>
    );
};

TestTab.propTypes = {
    getTestResults: PropTypes.func,
    testCallback: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    testCallback: state.scratchGui.vm.processTestFeedback.bind(state.scratchGui.vm),
    getTestResults: state.scratchGui.vm.getTestResults.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestTab);
