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
import {locateActiveBullet, zoomIn, zoomOut, zoomReset} from "../reducers/time-slider";

const TimelineTab = ({onZoomIn, onZoomOut, onResetZoom, onLocateActiveBullet}) => (
    <Box className={styles.wrapper}>
        <Timeline />
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

TimelineTab.propTypes = {
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,
    onResetZoom: PropTypes.func.isRequired,
    onLocateActiveBullet: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    // nothing needed for now
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
