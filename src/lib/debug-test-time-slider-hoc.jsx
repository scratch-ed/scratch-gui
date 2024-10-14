import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from 'itch';
import {
    setNumberOfFrames,
    setTimeFrame
} from '../reducers/time-slider.js';
import {
    updateSpriteBubble,
    updateSpriteState,
    updateStageState,
    updateTargetVariables,
    updateTargetMonitor,
    updateGeneralMonitor,
    updateAnswerMonitor
} from './time-slider-utility.js';
import VM from 'scratch-vm';

const DebugAndTestTimeSliderHOC = function (WrappedComponent) {
    class DebugAndTestTimeSliderWrapper extends React.Component {

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode ||
                   this.props.testMode !== nextProps.testMode ||
                   this.props.timeFrame !== nextProps.timeFrame ||
                   this.props.numberOfFrames !== nextProps.numberOfFrames;
        }

        componentDidUpdate (prevProps) {
            if (!this.props.context) {
                return;
            }

            if (this.props.debugMode || this.props.testMode) {
                if (this.props.vm.runtime.isPaused() && prevProps.timeFrame !== this.props.timeFrame) {
                    this.loadLogFrame();
                }
            }
        }

        loadClones (snapshot) {
            for (const spriteLog of snapshot.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    // Copy the list of clones in order to correctly remove all clones from the original list.
                    const currentClones = [...sprite.sprite.clones];

                    // Remove all clones of the current sprite that is not the sprite itself.
                    for (const clone of currentClones) {
                        if (!clone.isOriginal) {
                            this.props.vm.runtime.disposeTarget(clone);
                            this.props.vm.runtime.stopForTarget(clone);
                        }
                    }

                    // Initialize all clones of the current sprite.
                    for (const cloneLog of spriteLog.clones) {
                        const clone = sprite.makeClone();
                        // Store the most recent id of the clone in the log.
                        cloneLog.id = clone.id;

                        this.props.vm.runtime.addTarget(clone);
                        clone.goBehindOther(sprite);

                        updateSpriteState(clone, cloneLog);
                    }
                }
            }
        }

        loadSprites (snapshot) {
            for (const spriteLog of snapshot.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteState(sprite, spriteLog);
                }
            }

            const stageLog = snapshot.stage;
            if (stageLog) {
                updateStageState(this.props.vm.runtime.getTargetForStage(), stageLog);
            }
        }

        loadBubbles (snapshot) {
            for (const spriteLog of snapshot.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteBubble(sprite, spriteLog.bubbleState);

                    for (const cloneLog of spriteLog.clones) {
                        const clone = this.props.vm.runtime.getTargetById(cloneLog.id);

                        if (clone) {
                            updateSpriteBubble(clone, cloneLog.bubbleState);
                        }
                    }
                }
            }
        }

        loadVariables (snapshot) {
            for (const spriteLog of snapshot.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);
                if (sprite) {
                    updateTargetVariables(sprite, spriteLog.variables);
                }
            }

            const stageLog = snapshot.stage;
            const stage = this.props.vm.runtime.getTargetById(stageLog.id);
            if (stage) {
                updateTargetVariables(stage, stageLog.variables);
            }
        }

        loadMonitors (snapshot, timestamp) {
            const monitorState = this.props.context.vm.runtime.getMonitorState();
            for (const monitorId of monitorState.keys()) {
                const loggedTarget = snapshot.findTargetById(monitorId.substring(0, 20));
                if (loggedTarget) {
                    updateTargetMonitor(this.props.context.vm.runtime, loggedTarget, monitorId);
                } else {
                    updateGeneralMonitor(this.props.context.vm.runtime, snapshot, monitorId);
                }
            }

            // Restore answer
            const answerEvents = this.props.context.log.events.filter(e => e.type === 'answer');
            updateAnswerMonitor(this.props.context.vm.runtime, answerEvents, timestamp);
        }

        loadRuntime (snapshot) {
            // load runtime at timeFrame
            snapshot.restoreRuntime(this.props.vm.runtime);
        }

        loadLogFrame () {
            if (this.props.debugMode) {
                const snapshot = this.props.context.log.ops[this.props.timeFrame].previous;
                const timestamp = this.props.context.log.ops[this.props.timeFrame].timestamp;
                this.loadClones(snapshot);
                this.loadSprites(snapshot);
                this.loadBubbles(snapshot);
                this.loadVariables(snapshot);
                this.loadMonitors(snapshot, timestamp);
                this.loadRuntime(snapshot);
            } else {
                const snapshot = this.props.context.log.snapshots[this.props.timeFrame + 1];
                const timestamp = snapshot.timestamp;
                this.loadClones(snapshot);
                this.loadSprites(snapshot);
                this.loadBubbles(snapshot);
                this.loadVariables(snapshot);
                this.loadMonitors(snapshot, timestamp);
                this.loadRuntime(snapshot);
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'context',
                'debugMode',
                'testMode',
                'numberOfFrames',
                'timeFrame',
                'vm'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebugAndTestTimeSliderWrapper.propTypes = {
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        testMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        context: state.scratchGui.timeSlider.context,
        debugMode: state.scratchGui.timeSlider.debugMode,
        testMode: state.scratchGui.timeSlider.testMode,
        numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
        timeFrame: state.scratchGui.timeSlider.timeFrame,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebugAndTestTimeSliderWrapper);
};

export default DebugAndTestTimeSliderHOC;
