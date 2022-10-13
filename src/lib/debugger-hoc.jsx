import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    setContext,
    setDebugMode,
    setPaused,
    setNumberOfFrames,
    setRewindMode,
    setTimeFrame
} from '../reducers/debugger.js';
import {createContextWithVm, Context, snapshotFromVm} from '@ftrprf/judge-core';
import omit from 'lodash.omit';
import bindAll from 'lodash.bindall';
import {activateTab, BLOCKS_TAB_INDEX, DEBUGGER_TAB_INDEX} from '../reducers/editor-tab.js';

const DebuggerHOC = function (WrappedComponent) {
    class DebuggerWrapper extends React.Component {
        constructor (props) {
            super(props);

            bindAll(this, [
                'handleDebugModeDisabled',
                'handleDebugModeEnabled',
                'handleProjectLoaded',
                'handleProjectPaused',
                'handleProjectResumed',
                'handleRewindModeDisabled',
                'handleRewindModeEnabled',
                'handleThreadsStarted'
            ]);
        }

        componentDidMount () {
            this.addListeners();

            if (this.props.debugMode) {
                this.proxyAddFrame(this.props.context);
            }
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode;
        }

        async componentDidUpdate (prevProps) {
            if (prevProps.debugMode !== this.props.debugMode) {
                // If the debugger tab is selected when debug mode gets disabled,
                // switch the active tab to the blocks tab.
                if (!this.props.debugMode && this.props.activeTab === DEBUGGER_TAB_INDEX) {
                    this.props.activateTab(BLOCKS_TAB_INDEX);
                }

                await this.changeDebugMode();
            }
        }

        componentWillUnmount () {
            this.removeListeners();

            if (this.props.debugMode) {
                this.props.context.log.registerSnapshot = this.oldAddFrame;
            }
        }

        addListeners () {
            this.props.vm.runtime.addListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.addListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);

            this.props.vm.runtime.addListener('REWIND_MODE_DISABLED', this.handleRewindModeDisabled);
            this.props.vm.runtime.addListener('REWIND_MODE_ENABLED', this.handleRewindModeEnabled);

            this.props.vm.runtime.addListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.addListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.addListener('PROJECT_RESUMED', this.handleProjectResumed);

            this.props.vm.runtime.addListener('THREADS_STARTED', this.handleThreadsStarted);
        }

        removeListeners () {
            this.props.vm.runtime.removeListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.removeListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);

            this.props.vm.runtime.removeListener('REWIND_MODE_DISABLED', this.handleRewindModeDisabled);
            this.props.vm.runtime.removeListener('REWIND_MODE_ENABLED', this.handleRewindModeEnabled);

            this.props.vm.runtime.removeListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.removeListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.removeListener('PROJECT_RESUMED', this.handleProjectResumed);

            this.props.vm.runtime.removeListener('THREADS_STARTED', this.handleThreadsStarted);
        }

        handleDebugModeDisabled () {
            this.props.setDebugMode(false);
        }

        handleDebugModeEnabled () {
            this.props.setDebugMode(true);
        }

        /**
         * When a new project gets loaded into the VM, disable debug mode.
         */
        handleProjectLoaded () {
            this.props.vm.runtime.disableDebugMode();
        }

        handleProjectPaused () {
            this.props.setPaused(true);
        }

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        handleRewindModeDisabled () {
            this.props.setRewindMode(false);
            this.props.context.log.started = true;
        }

        handleRewindModeEnabled () {
            this.props.setRewindMode(true);
            this.props.context.log.started = false;
        }

        handleThreadsStarted () {
            if (this.props.debugMode) {
                this.props.context.log.reset();
                const snapshot = snapshotFromVm(this.props.vm);
                this.props.context.log.registerStartSnapshots(snapshot, snapshot);

                this.props.setTimeFrame(0);
                this.props.setNumberOfFrames(0);
            }
        }

        proxyAddFrame (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldAddFrame = context.log.registerEvent;
            context.log.registerEvent = new Proxy(this.oldAddFrame, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && argArray[0].type === 'ops') {
                        this.props.setTimeFrame(this.props.numberOfFrames);
                        this.props.setNumberOfFrames(this.props.numberOfFrames + 1);
                    }
                    return added;
                }
            });
        }

        async changeDebugMode () {
            this.props.vm.stopAll();

            if (this.props.debugMode) {
                const context = await createContextWithVm(this.props.vm);
                context.instrumentVm('debugger');
                context.log.started = true;
                const snapshot = snapshotFromVm(this.props.vm);
                context.log.registerStartSnapshots(snapshot, snapshot);
                this.props.setContext(context);

                this.proxyAddFrame(context);
            } else {
                this.props.vm.runtime.disableRewindMode();

                // Restore the VM to the state before the creation of the current context.
                await this.props.context.deinstrumentVm();
                this.props.setContext(null);

                this.props.setTimeFrame(0);
                this.props.setNumberOfFrames(0);
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'activeTab',
                'context',
                'debugMode',
                'numberOfFrames',
                'rewindMode',
                'timeFrame',
                'vm',
                'activateTab',
                'setContext',
                'setDebugMode',
                'setNumberOfFrames',
                'setPaused',
                'setRewindMode',
                'setTimeFrame'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerWrapper.propTypes = {
        activeTab: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        rewindMode: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        activateTab: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setDebugMode: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setRewindMode: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        rewindMode: state.scratchGui.debugger.rewindMode,
        timeFrame: state.scratchGui.debugger.timeFrame,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        activateTab: tab => dispatch(activateTab(tab)),
        setContext: context => dispatch(setContext(context)),
        setDebugMode: debugMode => dispatch(setDebugMode(debugMode)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setPaused: paused => dispatch(setPaused(paused)),
        setRewindMode: rewindMode => dispatch(setRewindMode(rewindMode)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerWrapper);
};

export default DebuggerHOC;
