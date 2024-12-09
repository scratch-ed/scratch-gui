import React from 'react';

import Box from '../components/box/box.jsx';
import Timeline from '../components/timeline/timeline.jsx';

import styles from '../components/test-results/test-results.css';

const TimelineTab = () => (
    <Box className={styles.wrapper}>
        <Timeline />
    </Box>
);

export default TimelineTab;
