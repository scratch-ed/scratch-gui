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
        place="right"
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

const Mark = ({timestamp, timeElapsed, test, handleClick, clearHighlighting, setHighlighting, highlighted}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${timestamp / timeElapsed * 100}%`}}
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
    timeElapsed: PropTypes.number,
    timestamp: PropTypes.number,
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func,
    highlighted: PropTypes.bool
};

const MarkMultiple = ({timestamps, timeElapsed, test, handleClick, clearHighlighting, setHighlighting}) => {
    const [highlighted, setHighlighted] = useState(false);
    return (<div className={styles.flexRow}>
        {timestamps.map(timestamp => (
            <Mark
                key={timestamp}
                timestamp={timestamp}
                timeElapsed={timeElapsed}
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
    timeElapsed: PropTypes.number,
    timestamps: PropTypes.arrayOf(PropTypes.number),
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func
};

const MarkRectangle = ({begin, end, timeElapsed, tickSize, test, handleClick, clearHighlighting, setHighlighting}) => (
    <div
        className={styles.timelineItem}
        style={{left: `${begin / timeElapsed * 100}%`}}
        onClick={handleClick}
    >
        <div
            className={styles.markRectangle}
            style={{
                width: `${(end - begin) * 100 / tickSize}px`,
                background: test.passed ? '#77d354' : '#f00d0d'
            }}
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
    timeElapsed: PropTypes.number,
    tickSize: PropTypes.number,
    begin: PropTypes.number,
    end: PropTypes.number,
    handleClick: PropTypes.func,
    clearHighlighting: PropTypes.func,
    setHighlighting: PropTypes.func
};

const Band = ({tests, timeElapsed, tickSize, setFrameMark, setFrameRange,
    clearHighlighting, highlightFrames, highlightFrameRange}) => (

    // eslint-disable-next-line react/jsx-indent
    <div className={styles.bandPadding}>
        <div className={styles.flexRow}>
            {
                tests.map(test => {
                    if (typeof test.marker === 'number') {
                        return (
                            <Mark
                                key={test.id}
                                timestamp={test.marker}
                                timeElapsed={timeElapsed}
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
                                timeElapsed={timeElapsed}
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
                            timeElapsed={timeElapsed}
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
    timeElapsed: PropTypes.number,
    tickSize: PropTypes.number,
    setFrameMark: PropTypes.func,
    setFrameRange: PropTypes.func,
    clearHighlighting: PropTypes.func,
    highlightFrames: PropTypes.func,
    highlightFrameRange: PropTypes.func
};

export default Band;
