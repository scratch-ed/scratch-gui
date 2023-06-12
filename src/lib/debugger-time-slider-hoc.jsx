import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from '@ftrprf/judge-core';
import {
    setNumberOfFrames,
    setTimeFrame
} from '../reducers/debugger.js';
import {
    positionsAreEqual,
    updateSpriteBubble,
    updateSpriteState,
    updateStageState,
    updateTargetVariables,
    updateTargetMonitor,
    updateGeneralMonitor,
    updateAnswerMonitor
} from './time-slider-utility.js';
import VM from 'scratch-vm';

const DebuggerTimeSliderHOC = function (WrappedComponent) {
    class DebuggerTimeSliderWrapper extends React.Component {

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode ||
                   this.props.timeFrame !== nextProps.timeFrame ||
                   this.props.numberOfFrames !== nextProps.numberOfFrames;
        }

        componentDidUpdate (prevProps) {
            if (!this.props.context) {
                return;
            }

            if (this.props.debugMode) {
                if (this.props.vm.runtime.isPaused() && prevProps.timeFrame !== this.props.timeFrame) {
                    this.loadLogFrame();
                }
            }
        }

        construct () {
            this.createSkins();
        }

        destruct () {
            this.destroySkins();
        }

        loadClones () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
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

        loadSprites () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteState(sprite, spriteLog);
                }
            }

            const stageLog = this.props.context.log.ops[this.props.timeFrame].previous.stage;
            if (stageLog) {
                updateStageState(this.props.vm.runtime.getTargetForStage(), stageLog);
            }
        }

        loadBubbles () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
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

        loadVariables () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);
                if (sprite) {
                    updateTargetVariables(sprite, spriteLog.variables);
                }
            }

            const stageLog = this.props.context.log.ops[this.props.timeFrame].previous.stage;
            const stage = this.props.vm.runtime.getTargetById(stageLog.id);
            if (stage) {
                updateTargetVariables(stage, stageLog.variables);
            }
        }

        loadMonitors () {
            const monitorState = this.props.context.vm.runtime.getMonitorState();
            const snapshot = this.props.context.log.ops[this.props.timeFrame].previous;
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
            const timestamp = this.props.context.log.ops[this.props.timeFrame].timestamp;
            updateAnswerMonitor(this.props.context.vm.runtime, answerEvents, timestamp);
        }

        loadRuntime () {
            // load runtime at timeFrame
            this.props.context.log.ops[this.props.timeFrame].previous.restoreRuntime(this.props.vm.runtime);
        }

        loadLogFrame () {
            this.loadClones();
            this.loadSprites();
            this.loadBubbles();
            this.loadVariables();
            this.loadMonitors();
            this.loadRuntime();
        }

        render () {
            const componentProps = omit(this.props, [
                'context',
                'debugMode',
                'numberOfFrames',
                'timeFrame',
                'vm'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerTimeSliderWrapper.propTypes = {
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        timeFrame: state.scratchGui.debugger.timeFrame,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerTimeSliderWrapper);
};

export default DebuggerTimeSliderHOC;
