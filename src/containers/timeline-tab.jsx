import React from 'react';

import Box from '../components/box/box.jsx';
import Timeline from '../components/timeline/timeline.jsx';
import zoomInButton from '../components/timeline/zoom-in.png';
import zoomOutButton from '../components/timeline/zoom-out.png';
import zoomResetButton from '../components/timeline/zoom-reset.png';

import styles from '../components/test-results/test-results.css';
import timelineStyles from '../components/timeline/timeline.css';
import {connect} from "react-redux";
import {zoomIn, zoomOut, zoomReset} from "../reducers/time-slider";

const TimelineTab = ({onZoomIn, onZoomOut, onResetZoom}) => (
    <Box className={styles.wrapper}>
        <Timeline />
        <button
            className={`${timelineStyles.zoomButton} ${timelineStyles.zoomInButton}`}
            onClick={onZoomIn}
        >
            <img
                draggable={false}
                src={zoomInButton}
                alt="Zoom-In"
            />
        </button>
        <button
            className={`${timelineStyles.zoomButton} ${timelineStyles.zoomOutButton}`}
            onClick={onZoomOut}
        >
            <img
                draggable={false}
                src={zoomOutButton}
                alt="Zoom-Out"
            />
        </button>
        <button
            className={`${timelineStyles.zoomButton} ${timelineStyles.zoomResetButton}`}
            onClick={onResetZoom}
        >
            <img
                draggable={false}
                src={zoomResetButton}
                alt="Zoom-Reset"
            />
        </button>
    </Box>
);

const mapStateToProps = state => ({
    // nothing needed for now
});

const mapDispatchToProps = dispatch => ({
    onZoomIn: () => dispatch(zoomIn()),
    onZoomOut: () => dispatch(zoomOut()),
    onResetZoom: () => dispatch(zoomReset())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TimelineTab);
