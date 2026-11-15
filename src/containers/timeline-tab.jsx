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
import ActiveCodeBlocks from "../components/debug-timeline/active-code-blocks.jsx";

const TimelineTab = ({
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onLocateActiveBullet,
    onBroadcastClick,
    onLinechartToggle,
    timeSliderMode,
    isTimelineSplit,
    context,
    timeFrame,
    editingTarget,
    sprites,
    stage
}) => {
    const [debugMode, setDebugMode] = useState(false);
    const [showLinechart, setShowLinechart] = useState(false);
    const [showCodeBlocks, setShowCodeBlocks] = useState(false);


    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
        setShowLinechart(false);
    };

    const toggleLinechart = () => {
        if (!showLinechart) {
            setShowLinechart(true);
            setShowCodeBlocks(false);

            if (onLinechartToggle) {
                onLinechartToggle(true);
            }
        }
    };

    const toggleCodeBlocks = () => {
        setShowCodeBlocks(!showCodeBlocks);
        setShowLinechart(false);
    };

    useEffect(() => {
        if (!isTimelineSplit) {
            setShowLinechart(false);
            setShowCodeBlocks(false);
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
                        <div className={timelineStyles.propertyButtons}>
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
                            <button
                                className={`${timelineStyles.mode} ${timelineStyles.codeButton}`}
                                style={{
                                    backgroundColor: showCodeBlocks ? "#cccccc" : "#f4f3f1",
                                    color: showCodeBlocks ? "#666666" : "black",
                                    cursor: "pointer",
                                }}
                                onClick={toggleCodeBlocks}
                            >
                                Code Blocks
                            </button>
                        </div>
                    </div>
                )
            }
            {timeSliderMode === TimeSliderMode.DEBUG && debugMode ?
                <DebugTimeline onBroadcastClick={onBroadcastClick} /> :
                <Timeline onBroadcastClick={onBroadcastClick} />
            }
            {timeSliderMode === TimeSliderMode.DEBUG && showCodeBlocks && (
                <ActiveCodeBlocks
                    context={context}
                    timeFrame={timeFrame}
                    editingTarget={editingTarget}
                    targetBlocks={
                        editingTarget === stage?.id ?
                            stage?.blocks || {} :
                            sprites[editingTarget]?.blocks || {}
                    }
                />
            )}
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
    isTimelineSplit: PropTypes.bool,
    context: PropTypes.shape({}),
    timeFrame: PropTypes.number,
    editingTarget: PropTypes.string,
    sprites: PropTypes.shape({}),
    stage: PropTypes.shape({})
};

const mapStateToProps = state => ({
    timeSliderMode: state.scratchGui.timeSlider.timeSliderMode,
    context: state.scratchGui.timeSlider.context,
    timeFrame: state.scratchGui.timeSlider.timeFrame,
    editingTarget: state.scratchGui.targets.editingTarget,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage
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
