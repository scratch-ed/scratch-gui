import React, { useState } from 'react';
import {run} from 'itch';

const TestingTab = () => {

    const [files, setFiles] = useState(null);

    const handleFileChange = e => {
        if (e.target.files) {
            setFiles(e.target.files);
        }
    };

    const handleUpload = async () => {
        // todo: fix check
        if (files && files.length > 0) {
            let configFile = null;
            for (let i = 0; i < files.length; i++) {
                if (files[i].name === 'config.json') {
                    configFile = files[i];
                    break;
                }
                // console.log(files[i].json());
            }

            if (configFile) {
                // const reader = new FileReader();
                // reader.onload = e => {
                //     const config = JSON.parse(reader.result)
                //
                //     console.log(config)
                // };
                // reader.readAsText(configFile);
                const config = await new Response(configFile).json();
                let template;
                let submission;
                let testplan;
                for (let i = 0; i < files.length; i++) {
                    if (files[i].name === config.template) {
                        template = await new Response(files[i]).arrayBuffer();
                    }
                    if (files[i].name === config.submission) {
                        submission = await new Response(files[i]).arrayBuffer();
                    }
                    if (files[i].name === config.testplan) {
                        const script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.async = false;
                        script.innerHTML = await new Response(files[i]).text();
                        document.head.appendChild(script);
                    }
                }
                init(document.getElementById('output'));
                await run({
                    ...config,
                    template,
                    submission,
                    testplan,
                    canvas: document.getElementById('scratch-stage'),
                });
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
                    value=""
                    webkitdirectory=""
                    directory=""
                    onChange={handleFileChange}
                />
            </div>
            {files && (
                <button
                    onClick={handleUpload}
                    className="submit"
                >Upload test</button>
            )}

            <canvas id="scratch-stage" />

            <h2 id="out">Output</h2>
            <div
                id="output"
                style={{marginBottom: '500px'}}
            />
        </div>
    );
};

export default TestingTab;
