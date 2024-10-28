import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import ReactTooltip from 'react-tooltip';

import TestComponent from '../test-results/test-component.jsx';

import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';

import styles from './test-markers.css';

import {injectIntl} from 'react-intl';

const TestMarkers = ({frames, onFrameChange}) => {
    return (<span className={styles.wrapper}>
        {
            frames.map((frame, index) => (
                <span key={index}>
                    {frame.length > 0 &&
                        <>
                            <img
                                className={styles.markerIcon}
                                draggable={false}
                                src={frame.every(test => test.passed) ? passedIcon : failedIcon}
                                onClick={() => onFrameChange(index)}
                                data-for={`hover-test-${index}`}
                                data-tip=""
                            />
                            <ReactTooltip
                                className={styles.tooltip}
                                effect="solid"
                                id={`hover-test-${index}`}
                                place="top"
                            >
                                {frame.map(test => (
                                    <TestComponent
                                        {...test}
                                        key={test.id}
                                    />))
                                }
                            </ReactTooltip>
                        </>
                    }
                </span>
            ))
        }
    </span>);
};

TestMarkers.propTypes = {
    frames: PropTypes.arrayOf(PropTypes.array),
    onFrameChange: PropTypes.func
};

export default injectIntl(TestMarkers);
