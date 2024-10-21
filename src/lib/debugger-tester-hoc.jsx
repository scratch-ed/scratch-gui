import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    setContext,
    setDebugMode,
    setTestMode,
    setPaused,
    setChanged,
    setNumberOfFrames,
    setTimeFrame,
    setRemoveFuture
} from '../reducers/time-slider.js';
import {createContextWithVm, Context, snapshotFromVm, snapshotFromSb3, runWithContext} from 'itch';
import omit from 'lodash.omit';
import bindAll from 'lodash.bindall';

const DebuggerAndTesterHOC = function (WrappedComponent) {
    class DebuggerAndTesterWrapper extends React.Component {
        constructor (props) {
            super(props);

            bindAll(this, [
                'handleDebugModeDisabled',
                'handleDebugModeEnabled',
                'handleTestingStopped',
                'handleTestingStarted',
                'handleProjectLoaded',
                'handleProjectPaused',
                'handleProjectResumed',
                'handleProjectChanged'
            ]);
        }

        componentDidMount () {
            this.addListeners();

            if (this.props.debugMode) {
                this.proxyRegisterEvent(this.props.context);
            } else if (this.props.testMode) {
                this.proxyRegisterSnapshot(this.props.context);
            }
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode ||
                this.props.testMode !== nextProps.testMode ||
                this.props.removeFuture !== nextProps.removeFuture;
        }

        async componentDidUpdate (prevProps) {
            if (prevProps.debugMode !== this.props.debugMode ||
                prevProps.testMode !== this.props.testMode) {
                await this.changeMode();
            }
            if ((this.props.debugMode || this.props.testMode) &&
                this.props.removeFuture && !prevProps.removeFuture) {
                // If changed, remove full history
                this.removeFuture();
                this.props.setRemoveFuture(false);
            }
        }

        componentWillUnmount () {
            this.removeListeners();

            if (this.props.debugMode) {
                this.props.context.log.registerEvent = this.oldRegisterEvent;
            }
            if (this.props.testMode) {
                this.props.context.log.registerSnapshot = this.oldRegisterSnapshot;
            }
        }

        addListeners () {
            this.props.vm.runtime.addListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.addListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);
            this.props.vm.runtime.addListener('TESTING_STOPPED', this.handleTestingStopped);
            this.props.vm.runtime.addListener('TESTING_STARTED', this.handleTestingStarted);

            this.props.vm.runtime.addListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.addListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.addListener('PROJECT_RESUMED', this.handleProjectResumed);
            this.props.vm.runtime.addListener('PROJECT_CHANGED', this.handleProjectChanged);
        }

        removeListeners () {
            this.props.vm.runtime.removeListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.removeListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);
            this.props.vm.runtime.removeListener('TESTING_STOPPED', this.handleTestingStopped);
            this.props.vm.runtime.removeListener('TESTING_STARTED', this.handleTestingStarted);

            this.props.vm.runtime.removeListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.removeListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.removeListener('PROJECT_RESUMED', this.handleProjectResumed);
            this.props.vm.runtime.removeListener('PROJECT_CHANGED', this.handleProjectChanged);
        }

        handleDebugModeDisabled () {
            this.props.setDebugMode(false);
        }

        handleDebugModeEnabled () {
            this.props.setDebugMode(true);
        }

        handleTestingStopped () {
        }

        async handleTestingStarted () {
            this.props.setTestMode(true);

            const context = await createContextWithVm(this.props.vm, this.props.testCallback);
            const submission = snapshotFromVm(this.props.vm);
            const template = snapshotFromSb3(this.props.vm.testTemplate);
            context.instrumentVm('judge');
            context.log.started = true;
            context.log.registerStartSnapshots(template, submission);

            this.props.setContext(context);
            this.proxyRegisterSnapshot(context);

            runWithContext({
                ...this.props.vm.testConfig,
                template: this.props.vm.testTemplate,
                callback: this.props.testCallback
            }, context, this.props.vm.runtime.getTestSignal());
        }

        /**
         * When a new project gets loaded into the VM, disable debug and test mode.
         */
        handleProjectLoaded () {
            this.props.vm.runtime.disableDebugMode();
            this.props.vm.runtime.stopTesting();
            this.props.vm.clearTestResults();
            this.props.setTestMode(false);
        }

        handleProjectPaused () {
            this.props.setPaused(true);
        }

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        handleProjectChanged () {
            if (this.props.debugMode || this.props.testMode) {
                this.props.vm.runtime.pause();
                this.props.setChanged(true);
            }
        }

        removeFuture () {
            if (this.props.numberOfFrames > 1) {
                if (this.props.debugMode) {
                    this.props.context.setLogEventRange(0, this.props.timeFrame + 1);
                    this.props.setNumberOfFrames(this.props.context.log.ops.length);
                } else {
                    this.props.context.setLogSnapshotRange(0, this.props.timeFrame + 1);
                    this.props.setNumberOfFrames(this.props.context.log.snapshots.length - 1);
                }
            }
        }

        /*
         * Removes everything except for the current and next frame
         */
        removeFullHistory () {
            if (this.props.numberOfFrames > 1) {
                if (this.props.debugMode) {
                    this.props.context.setLogEventRange(this.props.timeFrame, this.props.timeFrame + 2);
                    this.props.setNumberOfFrames(this.props.context.log.ops.length);
                } else {
                    this.props.context.setLogSnapshotRange(this.props.timeFrame, this.props.timeFrame + 2);
                    this.props.setNumberOfFrames(this.props.context.log.snapshots.length - 1);
                }
            }
        }

        proxyRegisterEvent (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldRegisterEvent = context.log.registerEvent;
            context.log.registerEvent = new Proxy(this.oldRegisterEvent, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && argArray[0].type === 'ops') {
                        // The UI needs to reflect the new log entry
                        if (this.props.changed) {
                            // If changed, remove full history
                            this.removeFullHistory();
                            this.props.setChanged(false);
                        }
                        this.props.setNumberOfFrames(this.props.context.log.ops.length);
                        this.props.setTimeFrame(this.props.context.log.ops.length - 1);
                    }
                    return added;
                }
            });
        }

        proxyRegisterSnapshot (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldRegisterSnapshot = context.log.registerSnapshot;
            context.log.registerSnapshot = new Proxy(this.oldRegisterSnapshot, {
                apply: (target, thisArg, argArray) => {
                    if (this.props.testMode) {
                        const added = target.apply(thisArg, argArray);
                        // The UI needs to reflect the new log entry
                        if (this.props.changed) {
                            // If changed, remove full history
                            this.removeFullHistory();
                            this.props.setChanged(false);
                        }
                        this.props.setNumberOfFrames(this.props.context.log.snapshots.length - 1);
                        this.props.setTimeFrame(this.props.context.log.snapshots.length - 2);
                        return added;
                    }
                }
            });
        }

        async changeMode () {
            if (this.props.debugMode) {
                const context = await createContextWithVm(this.props.vm);
                context.instrumentVm('debugger');
                context.log.started = true;
                const snapshot = snapshotFromVm(this.props.vm);
                context.log.registerStartSnapshots(snapshot, snapshot);

                this.props.setContext(context);
                this.proxyRegisterEvent(context);

            } else if (!this.props.testMode) {
                // Restore the VM to the state before the creation of the current context.
                await this.props.context.deinstrumentVm();
                this.props.setContext(null);

                this.props.setNumberOfFrames(0);
                this.props.setTimeFrame(0);
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'activeTab',
                'context',
                'debugMode',
                'testMode',
                'numberOfFrames',
                'timeFrame',
                'vm',
                'setContext',
                'setDebugMode',
                'setTestMode',
                'setNumberOfFrames',
                'setPaused',
                'setChanged',
                'setRemoveFuture',
                'setTimeFrame',
                'changed',
                'testCallback',
                'removeFuture'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerAndTesterWrapper.propTypes = {
        activeTab: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        testMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        setContext: PropTypes.func.isRequired,
        setDebugMode: PropTypes.func.isRequired,
        setTestMode: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setChanged: PropTypes.func.isRequired,
        setRemoveFuture: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired,
        changed: PropTypes.bool.isRequired,
        testCallback: PropTypes.func.isRequired,
        removeFuture: PropTypes.bool.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.timeSlider.context,
        debugMode: state.scratchGui.timeSlider.debugMode,
        testMode: state.scratchGui.timeSlider.testMode,
        numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
        timeFrame: state.scratchGui.timeSlider.timeFrame,
        changed: state.scratchGui.timeSlider.changed,
        removeFuture: state.scratchGui.timeSlider.removeFuture,
        vm: state.scratchGui.vm,
        testCallback: state.scratchGui.vm.processTestFeedback.bind(state.scratchGui.vm)
    });

    const mapDispatchToProps = dispatch => ({
        setContext: context => dispatch(setContext(context)),
        setDebugMode: debugMode => dispatch(setDebugMode(debugMode)),
        setTestMode: testMode => dispatch(setTestMode(testMode)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setPaused: paused => dispatch(setPaused(paused)),
        setChanged: changed => dispatch(setChanged(changed)),
        setRemoveFuture: removeFuture => dispatch(setRemoveFuture(removeFuture)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerAndTesterWrapper);
};

export default DebuggerAndTesterHOC;
