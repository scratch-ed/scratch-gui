import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {run} from 'itch';
import {init} from '../components/test-tab/test-output.js';
import {connect} from 'react-redux';

const TestTab = ({saveProjectSb3}) => {

    const [filesUploaded, setFilesUploaded] = useState(false);
    const [config, setConfig] = useState(null);
    const [template, setTemplate] = useState(null);
    const [scriptText, setScriptText] = useState(null);

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
                        setTemplate(await new Response(files[i]).arrayBuffer());
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
        if (config) {
            const submission = await new Response(await saveProjectSb3()).arrayBuffer();

            const script = document.createElement('script');
            script.className = 'test-script';
            script.type = 'text/javascript';
            script.async = false;
            script.innerHTML = scriptText;
            document.head.appendChild(script);

            init(document.getElementById('output'));

            try {
                await run({
                    ...config,
                    template,
                    submission,
                    canvas: document.getElementById('scratch-stage')
                });
            } catch (error) {
                console.error(error.message);
            } finally {
                document.head.removeChild(script);
            }
        }
    };

    return (
        <div>
            <h1>Runner Environment</h1>

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
                >Upload test</button>
            )}
            <span>{failureMessage}</span>

            <canvas id="scratch-stage" />

            <h2 id="out">Output</h2>
            <div
                id="output"
                style={{maxHeight: '200px', overflowY: 'auto'}}
            />
        </div>
    );
};

TestTab.propTypes = {
    saveProjectSb3: PropTypes.func
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(TestTab);
