import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {runInVM, snapshotFromVm} from 'itch';
import TestResultComponent from '../components/test-results/test-results.jsx';
import {connect} from 'react-redux';
import {VM} from 'scratch-vm';

const TestTab = ({vm, clear, loadProject, saveProjectSb3, getTestResults, testCallback}) => {
    const [filesUploaded, setFilesUploaded] = useState(false);
    const [config, setConfig] = useState(null);
    const [template, setTemplate] = useState(null);
    const [scriptText, setScriptText] = useState(null);
    const [testFailed, setTestFailed] = useState(false);

    let failureMessage = null;
    if (filesUploaded) {
        if (config === null) {
            failureMessage = 'Config file not found';
        } else if (template === null) {
            failureMessage = 'Template project not found';
        } else if (scriptText === null) {
            failureMessage = 'Testplan not found';
        }
    }

    const handleFileChange = async e => {
        if (testFailed) {
            setTestFailed(false);
        }

        if (e.target.files) {
            setFilesUploaded(true);
            const files = e.target.files;
            let conf;
            for (let i = 0; i < files.length; i++) {
                if (files[i].name === 'config.json') {
                    conf = await new Response(files[i]).json();
                    setConfig(conf);
                    break;
                }
            }

            if (conf) {
                let found = false;
                for (let i = 0; i < files.length; i++) {
                    // webkitRelativePath contains the folder name that was uploaded
                    const webkitPath = files[i].webkitRelativePath;
                    // strip first part of path to get rid of folder name
                    const filePath = webkitPath.substring(webkitPath.indexOf('/') + 1);

                    if (filePath === conf.template) {
                        const currentSb3 = await new Response(await saveProjectSb3()).arrayBuffer();
                        await loadProject(await new Response(files[i]).arrayBuffer());
                        setTemplate(snapshotFromVm(vm));
                        await clear();
                        await loadProject(currentSb3);
                        if (found) return;
                        found = true;
                    }
                    if (filePath === conf.testplan) {
                        setScriptText(await new Response(files[i]).text());
                        if (found) return;
                        found = true;
                    }
                }
            }
        }
    };

    const handleUpload = async () => {
        if (testFailed) {
            setTestFailed(false);
        }

        if (config) {
            const script = document.createElement('script');
            script.className = 'test-script';
            script.type = 'text/javascript';
            script.async = false;
            script.innerHTML = scriptText;
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
            <h1>{'Runner Environment'}</h1>

            <div className="run-form">
                <input
                    type="file"
                    id="submission"
                    webkitdirectory=""
                    directory=""
                    onChange={handleFileChange}
                />
            </div>
            {(filesUploaded && failureMessage === null) && (
                <button
                    onClick={handleUpload}
                    className="submit"
                >{'Upload test'}</button>
            )}
            <span>{failureMessage}</span>

            <canvas id="scratch-stage" />

            <h2 id="out">{'Output'}</h2>
            {testFailed && (
                <span>{'Sprites in submission don\'t match sprites in template'}</span>
            )}
            <div><TestResultComponent testResults={getTestResults()} /></div>
            <div
                id="output"
                style={{maxHeight: '200px', overflowY: 'auto'}}
            />
        </div>
    );
};

TestTab.propTypes = {
    clear: PropTypes.func,
    loadProject: PropTypes.func,
    saveProjectSb3: PropTypes.func,
    getTestResults: PropTypes.func,
    testCallback: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => ({
    clear: state.scratchGui.vm.clear.bind(state.scratchGui.vm),
    loadProject: state.scratchGui.vm.loadProject.bind(state.scratchGui.vm),
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm),
    testCallback: state.scratchGui.vm.processTestFeedback.bind(state.scratchGui.vm),
    getTestResults: state.scratchGui.vm.getTestResults.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestTab);
