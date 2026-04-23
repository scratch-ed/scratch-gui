import React, { useEffect, useState } from 'react';

import Box from '../components/box/box.jsx';
import Timeline from '../components/timeline/timeline.jsx';
import zoomInButton from '../components/timeline/zoom-in.png';
import zoomOutButton from '../components/timeline/zoom-out.png';
import zoomResetButton from '../components/timeline/zoom-reset.png';
import locateActiveBulletButton from '../components/timeline/targeting.png';

import styles from '../components/test-results/test-results.css';
import timelineStyles from '../components/timeline/timeline.css';
import {connect} from "react-redux";
import PropTypes from 'prop-types';
import {locateActiveBullet, TimeSliderMode, zoomIn, zoomOut, zoomReset} from "../reducers/time-slider";
import DebugTimeline from "../components/debug-timeline/debug-timeline.jsx";

const TimelineTab = ({onZoomIn, onZoomOut, onResetZoom, onLocateActiveBullet, onBroadcastClick, onLinechartToggle, timeSliderMode, isTimelineSplit}) => {
    const [debugMode, setDebugMode] = useState(false);
    const [showLinechart, setShowLinechart] = useState(false);


    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
        setShowLinechart(false);
    };

    const toggleLinechart = () => {
        if (!showLinechart) {
            setShowLinechart(true);

            if (onLinechartToggle) {
                onLinechartToggle(true);
            }
        }
    };

    useEffect(() => {
        if (!isTimelineSplit) {
            setShowLinechart(false);
        }
    }, [isTimelineSplit]);

    return (
        <Box className={styles.wrapper}>
            {
                timeSliderMode === TimeSliderMode.DEBUG && (
                    <div className={timelineStyles.debugControls}>
                        <div className={timelineStyles.debugButtons}>
                            <button
                                className={timelineStyles.mode}
                                style={{
                                    backgroundColor: debugMode ? "#f4f3f1" : "#4CAF50",
                                    color: debugMode ? "black" : "white",
                                }}
                                onClick={toggleDebugMode}
                            >
                                Standard Mode
                            </button>
                            <button
                                className={timelineStyles.mode}
                                style={{
                                    backgroundColor: debugMode ? "#4CAF50" : "#f4f3f1",
                                    color: debugMode ? "white" : "black",
                                }}
                                onClick={toggleDebugMode}
                            >
                                Debug Mode
                            </button>
                        </div>
                        <button
                            className={`${timelineStyles.mode} ${timelineStyles.chartButton}`}
                            style={{
                                backgroundColor: showLinechart ? "#cccccc" : "#f4f3f1",
                                color: showLinechart ? "#666666" : "black",
                                cursor: showLinechart ? "not-allowed" : "pointer",
                            }}
                            onClick={toggleLinechart}
                            disabled={showLinechart}
                        >
                            More Properties
                        </button>
                    </div>
                )
            }
            {timeSliderMode === TimeSliderMode.DEBUG && debugMode ?
                <DebugTimeline onBroadcastClick={onBroadcastClick} /> :
                <Timeline onBroadcastClick={onBroadcastClick} />
            }
            <button
                className={`${timelineStyles.floatButton} ${timelineStyles.zoomInButton}`}
                onClick={onZoomIn}
            >
                <img
                    draggable={false}
                    src={zoomInButton}
                    alt="Zoom-In"
                />
            </button>
            <button
                className={`${timelineStyles.floatButton} ${timelineStyles.zoomOutButton}`}
                onClick={onZoomOut}
            >
                <img
                    draggable={false}
                    src={zoomOutButton}
                    alt="Zoom-Out"
                />
            </button>
            <button
                className={`${timelineStyles.floatButton} ${timelineStyles.zoomResetButton}`}
                onClick={onResetZoom}
            >
                <img
                    draggable={false}
                    src={zoomResetButton}
                    alt="Zoom-Reset"
                />
            </button>
            <button
                className={`${timelineStyles.floatButton} ${timelineStyles.locateActiveButton}`}
                onClick={onLocateActiveBullet}
            >
                <img
                    draggable={false}
                    src={locateActiveBulletButton}
                    alt="Locate-Active-Bullet"
                />
            </button>
        </Box>
    );
};

TimelineTab.propTypes = {
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    onResetZoom: PropTypes.func.isRequired,
    onLocateActiveBullet: PropTypes.func.isRequired,
    onBroadcastClick: PropTypes.func,
    onLinechartToggle: PropTypes.func,
    timeSliderMode: PropTypes.string.isRequired,
    isTimelineSplit: PropTypes.bool
};

const mapStateToProps = state => ({
    timeSliderMode: state.scratchGui.timeSlider.timeSliderMode
});

const mapDispatchToProps = dispatch => ({
    onZoomIn: () => dispatch(zoomIn()),
    onZoomOut: () => dispatch(zoomOut()),
    onResetZoom: () => dispatch(zoomReset()),
    onLocateActiveBullet: () => dispatch(locateActiveBullet())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TimelineTab);
