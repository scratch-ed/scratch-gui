import React from 'react';

import Box from '../components/box/box.jsx';
import Timeline from '../components/timeline/timeline.jsx';
import zoomIn from '../components/timeline/zoom-in.png';
import zoomOut from '../components/timeline/zoom-out.png';

import styles from '../components/test-results/test-results.css';
import timelineStyles from '../components/timeline/timeline.css';

const TimelineTab = () => (
    <Box className={styles.wrapper}>
        <Timeline/>
        <button className={`${timelineStyles.zoomButton} ${timelineStyles.zoomInButton}`}>
            <img
                draggable={false}
                src={zoomIn}
                alt="Zoom-In"
            />
        </button>
        <button className={`${timelineStyles.zoomButton} ${timelineStyles.zoomOutButton}`}>
            <img
                draggable={false}
                src={zoomOut}
                alt="Zoom-Out"
            />
        </button>
    </Box>
);

export default TimelineTab;
