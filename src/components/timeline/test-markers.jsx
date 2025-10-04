import React, {useState} from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import ReactTooltip from 'react-tooltip';
import passedIcon from '../test-results/passed.png';
import failedIcon from '../test-results/failed.png';

import styles from './timeline.css';

const TestTooltip = ({test}) => (
    <ReactTooltip
        className={styles.tooltip}
        effect="solid"
        id={test.id}
        place="left"
    >
        {test.feedback ? test.feedback : test.name}
    </ReactTooltip>
);

TestTooltip.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool
    })
};

const Mark = ({timePlaced, test, handleClick, clearHighlighting, setHighlighting, highlighted}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${timePlaced}%`}}
        onClick={handleClick}
    >
        <img
            className={classNames(styles.markerIcon, {
                [styles.highlightIcon]: highlighted
            })}
            draggable={false}
            src={test.passed ? passedIcon : failedIcon}
            data-for={test.id}
            data-tip=""
            onMouseEnter={setHighlighting}
            onMouseLeave={clearHighlighting}
        />
        <TestTooltip test={test} />
    </div>
);

Mark.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    timePlaced: PropTypes.number,
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func,
    highlighted: PropTypes.bool
};

const MarkMultiple = ({timestamps, mapTime, test, handleClick, clearHighlighting, setHighlighting}) => {
    const [highlighted, setHighlighted] = useState(false);
    return (<div className={styles.flexRow}>
        {timestamps.map(timestamp => (
            <Mark
                key={timestamp}
                timePlaced={mapTime(timestamp)}
                test={test}
                handleClick={() => handleClick(timestamp)}
                highlighted={highlighted}
                clearHighlighting={() => {
                    setHighlighted(false);
                    clearHighlighting();
                }}
                setHighlighting={() => {
                    setHighlighted(true);
                    setHighlighting();
                }}
            />
        ))}
    </div>)
};

MarkMultiple.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    mapTime: PropTypes.func,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func
};

const MarkRectangle = ({begin, end, mapTime, mapWidth, tickSize, test, handleClick, clearHighlighting, setHighlighting}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${mapTime(begin)}%`}}
        onClick={handleClick}
    >
        <div
            className={classNames(styles.markRectangle, test.passed ? styles.testPassed : styles.testFailed)}
            style={{width: `${(mapWidth(end) - mapWidth(begin)) * 100 / tickSize}px`}}
            data-for={test.id}
            data-tip=""
            onMouseEnter={setHighlighting}
            onMouseLeave={clearHighlighting}
        >{test.feedback ? test.feedback : test.name}
        </div>
        <TestTooltip test={test} />
    </div>
);

MarkRectangle.propTypes = {
    test: PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    }),
    mapTime: PropTypes.func,
    mapWidth: PropTypes.func,
    tickSize: PropTypes.number,
    begin: PropTypes.number,
    end: PropTypes.number,
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func
};

const Band = ({tests, mapTime, mapWidth, tickSize, setFrameMark, setFrameRange,
    clearHighlighting, highlightFrames, highlightFrameRange}) => (

    // eslint-disable-next-line react/jsx-indent
    <div className={classNames(styles.flexRow, styles.rowMargin)}>
        {
            tests.map(test => {
                if (typeof test.marker === 'number') {
                    return (
                        <Mark
                            key={test.id}
                            timePlaced={mapTime(test.marker)}
                            test={test}
                            handleClick={() => setFrameMark(test.marker)}
                            clearHighlighting={clearHighlighting}
                            setHighlighting={() => highlightFrames([test.marker])}
                        />
                    );
                } else if (Array.isArray(test.marker)) {
                    return (
                        <MarkMultiple
                            key={test.id}
                            timestamps={test.marker}
                            mapTime={mapTime}
                            test={test}
                            handleClick={setFrameMark}
                            clearHighlighting={clearHighlighting}
                            setHighlighting={() => highlightFrames(test.marker)}
                        />
                    );
                }
                return (
                    <MarkRectangle
                        key={test.id}
                        begin={test.marker.start}
                        end={test.marker.end}
                        mapTime={mapTime}
                        mapWidth={mapWidth}
                        tickSize={tickSize}
                        test={test}
                        handleClick={() => setFrameRange(test.marker.start, test.marker.end)}
                        clearHighlighting={clearHighlighting}
                        setHighlighting={() => highlightFrameRange(test.marker.start, test.marker.end)}
                    />
                );
            })
        }
    </div>
);

Band.propTypes = {
    tests: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        feedback: PropTypes.string,
        id: PropTypes.string,
        passed: PropTypes.bool,
        marker: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number), PropTypes.object])
    })),
    mapTime: PropTypes.func,
    mapWidth: PropTypes.func,
    tickSize: PropTypes.number,
    setFrameMark: PropTypes.func,
    setFrameRange: PropTypes.func,
    clearHighlighting: PropTypes.func,
    highlightFrames: PropTypes.func,
    highlightFrameRange: PropTypes.func
};

export default Band;
