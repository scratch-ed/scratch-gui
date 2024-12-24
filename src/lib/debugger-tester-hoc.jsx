import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    TimeSliderMode,
    TimeSliderStates,
    setContext,
    startDebugging,
    startTesting,
    finishTesting,
    closeSlider,
    setPaused,
    setChanged,
    setNumberOfFrames,
    setTimestamps,
    addEvent,
    setEvents,
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
                'handleTestModeDisabled',
                'handleTestingStopped',
                'handleTestingStarted',
                'handleProjectLoaded',
                'handleProjectPaused',
                'handleProjectResumed',
                'handleProjectChanged'
            ]);

            this.state = {
                refreshed: false
            };
        }

        componentDidMount () {
            this.addListeners();

            if (this.props.timeSliderMode === TimeSliderMode.DEBUG) {
                this.proxyRegisterEvent(this.props.context);
                this.proxyRegisterSnapshot(this.props.context);
            } else if (this.props.timeSliderMode === TimeSliderMode.TEST_RUNNING) {
                this.proxyRegisterSnapshot(this.props.context);
            }
        }

        shouldComponentUpdate (nextProps) {
            return this.props.timeSliderMode !== nextProps.timeSliderMode ||
                this.props.removeFuture !== nextProps.removeFuture;
        }

        async componentDidUpdate (prevProps) {
            if (prevProps.timeSliderMode !== this.props.timeSliderMode) {
                await this.changeMode(prevProps.timeSliderMode);
            }
            if ((this.props.timeSliderMode !== TimeSliderMode.OFF) &&
                this.props.removeFuture && !prevProps.removeFuture) {
                // If changed, remove full history
                this.removeFuture();
                this.props.setRemoveFuture(false);
            }
        }

        componentWillUnmount () {
            this.removeListeners();

            if (this.props.context) {
                if (typeof this.oldRegisterEvent !== 'undefined') {
                    this.props.context.log.registerEvent = this.oldRegisterEvent;
                }
                if (typeof this.oldRegisterSnapshot !== 'undefined') {
                    this.props.context.log.registerSnapshot = this.oldRegisterSnapshot;
                }
            }
        }

        addListeners () {
            this.props.vm.runtime.addListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.addListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);
            this.props.vm.runtime.addListener('TESTING_STOPPED', this.handleTestingStopped);
            this.props.vm.runtime.addListener('TESTING_STARTED', this.handleTestingStarted);
            this.props.vm.runtime.addListener('TEST_MODE_DISABLED', this.handleTestModeDisabled);

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
            this.props.vm.runtime.removeListener('TEST_MODE_DISABLED', this.handleTestModeDisabled);

            this.props.vm.runtime.removeListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.removeListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.removeListener('PROJECT_RESUMED', this.handleProjectResumed);
            this.props.vm.runtime.removeListener('PROJECT_CHANGED', this.handleProjectChanged);
        }

        handleDebugModeDisabled () {
            this.props.closeSlider();
        }

        handleDebugModeEnabled () {
            this.props.startDebugging();
        }

        handleTestModeDisabled () {
            this.props.closeSlider();
        }

        handleTestingStopped () {
            this.props.finishTesting();

            if (this.props.context) {
                this.props.setNumberOfFrames(this.props.context.log.snapshots.length);
                this.props.setTimeFrame(this.props.context.log.snapshots.length - 1);
                this.props.setTimestamps(this.props.context.log.snapshots.map(snap => snap.timestamp));
                this.props.setEvents(this.props.context.log.events.filter(e =>
                    e.type !== 'block_execution'
                ).map(e => {
                    const {nextSnapshot, previousSnapshot, ...event} = e;
                    return {
                        ...event,
                        begin: nextSnapshot.timestamp,
                        end: previousSnapshot.timestamp
                    };
                }));
            }
        }

        handleTestingStarted () {
            this.props.startTesting();
        }

        /**
         * When a new project gets loaded into the VM, disable debug and test mode.
         */
        handleProjectLoaded () {
            this.props.vm.runtime.disableDebugMode();
            this.props.vm.runtime.disableTestMode();
            this.props.vm.clearTestResults();
        }

        handleProjectPaused () {
            this.props.setPaused(true);
        }

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        handleProjectChanged () {
            if (this.state.refreshed) {
                // Hack for bug where workspace refreshes result in wrong project change emissions.
                setTimeout(() => {
                    this.setState({refreshed: false});
                }, 100);
                return;
            }

            if (this.props.timeSliderMode === TimeSliderMode.DEBUG) {
                this.props.vm.runtime.pause();
                this.props.setChanged(true);
            } else if (this.props.timeSliderMode !== TimeSliderMode.OFF) {
                this.props.closeSlider();
            }
        }

        removeFuture () {
            if (this.props.numberOfFrames > 1) {
                this.props.context.setLogSnapshotRange(0, this.props.timeFrame + 1);
                this.props.setNumberOfFrames(this.props.context.log.snapshots.length);
            }
        }

        /*
         * Removes everything except for the current and next frame
         */
        removeFullHistory () {
            if (this.props.numberOfFrames > 1) {
                this.props.context.setLogSnapshotRange(this.props.timeFrame, this.props.timeFrame + 2);
                this.props.setNumberOfFrames(this.props.context.log.snapshots.length);
            }
        }

        proxyRegisterSnapshot (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldRegisterSnapshot = context.log.registerSnapshot;
            context.log.registerSnapshot = new Proxy(this.oldRegisterSnapshot, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && this.props.context) {
                        // The UI needs to reflect the new log entry
                        if (this.props.changed) {
                            // If changed, remove full history
                            this.removeFullHistory();
                            this.props.setChanged(false);
                        }
                        this.props.setNumberOfFrames(this.props.context.log.snapshots.length);
                        this.props.setTimeFrame(this.props.context.log.snapshots.length - 1);
                        this.props.setTimestamps(this.props.context.log.snapshots.map(snap => snap.timestamp));
                    }
                    return added;
                }
            });
        }

        proxyRegisterEvent (context) {
            // Register new events as they get added to the log.
            this.oldRegisterEvent = context.log.registerEvent;
            context.log.registerEvent = new Proxy(this.oldRegisterEvent, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && this.props.context) {
                        const {nextSnapshot, previousSnapshot, ...event} = argArray[0];
                        this.props.addEvent({
                            ...event,
                            begin: nextSnapshot.timestamp,
                            end: previousSnapshot.timestamp
                        });
                    }
                    return added;
                }
            });
        }

        async changeMode (prevMode) {
            if (this.props.timeSliderMode === TimeSliderMode.TEST_FINISHED) {
                if (this.props.context) {
                    this.setState({refreshed: true});
                    // Hack to reload workspace due to bug that causes runtime primitives
                    // not being able to be changed if any blocks have been run
                    this.props.vm.emitWorkspaceUpdate();
                    // Restore the VM to the state before the creation of the current context.
                    await this.props.context.deinstrumentVm();
                }
                return;
            }

            if (this.props.timeSliderMode === TimeSliderMode.OFF ||
                prevMode !== TimeSliderMode.OFF) {

                await this.props.context.deinstrumentVm();
                this.props.setContext(null);
                this.props.setNumberOfFrames(0);
                this.props.setTimeFrame(0);
                this.props.setEvents([]);
            }

            if (this.props.timeSliderMode === TimeSliderMode.DEBUG) {
                this.props.vm.clearTestResults();

                const context = await createContextWithVm(this.props.vm);
                context.instrumentVm('debugger');
                context.log.started = true;
                const snapshot = snapshotFromVm(this.props.vm);
                context.log.registerStartSnapshots(snapshot, snapshot);

                this.props.setContext(context);
                this.proxyRegisterSnapshot(context);
                this.proxyRegisterEvent(context);

            } else if (this.props.timeSliderMode === TimeSliderMode.TEST_RUNNING) {
                this.props.vm.clearTestResults();

                const context = await createContextWithVm(this.props.vm, this.props.testCallback);
                const submission = snapshotFromVm(this.props.vm);
                const template = snapshotFromSb3(this.props.vm.testTemplate);
                context.instrumentVm('tester');
                context.log.started = true;
                context.log.registerStartSnapshots(template, submission);

                this.props.setContext(context);

                runWithContext({
                    ...this.props.vm.testConfig,
                    template: this.props.vm.testTemplate,
                    callback: this.props.testCallback
                }, context, this.props.vm.runtime.getTestSignal());
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'activeTab',
                'context',
                'timeSliderMode',
                'numberOfFrames',
                'timeFrame',
                'vm',
                'setContext',
                'startDebugging',
                'startTesting',
                'finishTesting',
                'closeSlider',
                'setNumberOfFrames',
                'setTimestamps',
                'addEvent',
                'setEvents',
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
        timeSliderMode: PropTypes.oneOf(TimeSliderStates).isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        setContext: PropTypes.func.isRequired,
        startDebugging: PropTypes.func.isRequired,
        startTesting: PropTypes.func.isRequired,
        finishTesting: PropTypes.func.isRequired,
        closeSlider: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimestamps: PropTypes.func.isRequired,
        addEvent: PropTypes.func.isRequired,
        setEvents: PropTypes.func.isRequired,
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
        timeSliderMode: state.scratchGui.timeSlider.timeSliderMode,
        numberOfFrames: state.scratchGui.timeSlider.numberOfFrames,
        timeFrame: state.scratchGui.timeSlider.timeFrame,
        changed: state.scratchGui.timeSlider.changed,
        removeFuture: state.scratchGui.timeSlider.removeFuture,
        vm: state.scratchGui.vm,
        testCallback: state.scratchGui.vm.processTestFeedback.bind(state.scratchGui.vm)
    });

    const mapDispatchToProps = dispatch => ({
        setContext: context => dispatch(setContext(context)),
        startDebugging: () => dispatch(startDebugging()),
        startTesting: () => dispatch(startTesting()),
        finishTesting: () => dispatch(finishTesting()),
        closeSlider: () => dispatch(closeSlider()),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setTimestamps: timestamps => dispatch(setTimestamps(timestamps)),
        addEvent: event => dispatch(addEvent(event)),
        setEvents: events => dispatch(setEvents(events)),
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
