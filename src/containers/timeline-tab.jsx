import React from 'react';

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

const TimelineTab = ({onZoomIn, onZoomOut, onResetZoom, onLocateActiveBullet, timeSliderMode}) => {
    const [debugMode, setDebugMode] = React.useState(false);

    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
    };

    return (
        <Box className={styles.wrapper}>
            {
                timeSliderMode === TimeSliderMode.DEBUG && (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "1rem",
                        marginTop: "20px",
                        marginBottom: "20px",
                    }}>
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
                )
            }
            {timeSliderMode === TimeSliderMode.DEBUG && debugMode ? <DebugTimeline/> : <Timeline/>}
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
