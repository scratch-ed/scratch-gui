import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    setContext,
    setDebugMode,
    setPaused,
    setChanged,
    setNumberOfFrames,
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
                'handleProjectChanged'
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

            this.props.vm.runtime.addListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.addListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.addListener('PROJECT_RESUMED', this.handleProjectResumed);
            this.props.vm.runtime.addListener('PROJECT_CHANGED', this.handleProjectChanged);
        }

        removeListeners () {
            this.props.vm.runtime.removeListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.removeListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);

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

        /**
         * When a new project gets loaded into the VM, disable debug mode.
         */
        handleProjectLoaded () {
            this.props.vm.runtime.disableDebugMode();
        }

        handleProjectPaused () {
            this.props.setPaused(true);
        }

        onlyKeepCurrentTimeFrame () {
            if (this.props.context && this.props.context.log.started) {
                this.props.context.setLogRange(this.props.timeFrame + 1, this.props.timeFrame + 2);
                this.props.setNumberOfFrames(1);
                this.props.setTimeFrame(0);
            }
        }

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        handleProjectChanged () {
            this.props.vm.runtime.pause();
            this.props.setChanged(true);
        }

        proxyAddFrame (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldAddFrame = context.log.registerEvent;
            context.log.registerEvent = new Proxy(this.oldAddFrame, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && argArray[0].type === 'ops') {
                        // The debugger UI needs to reflect the new log entry
                        if (this.props.changed) {
                            // If changed, remove full history
                            this.onlyKeepCurrentTimeFrame();
                            this.props.setChanged(false);
                        } else {
                            this.props.setNumberOfFrames(this.props.context.log.ops.length);
                            this.props.setTimeFrame(this.props.context.log.ops.length - 1);
                        }
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
                'numberOfFrames',
                'timeFrame',
                'vm',
                'activateTab',
                'setContext',
                'setDebugMode',
                'setNumberOfFrames',
                'setPaused',
                'setChanged',
                'setTimeFrame',
                'changed'
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
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        activateTab: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setDebugMode: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setChanged: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired,
        changed: PropTypes.bool.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        timeFrame: state.scratchGui.debugger.timeFrame,
        changed: state.scratchGui.debugger.changed,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        activateTab: tab => dispatch(activateTab(tab)),
        setContext: context => dispatch(setContext(context)),
        setDebugMode: debugMode => dispatch(setDebugMode(debugMode)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setPaused: paused => dispatch(setPaused(paused)),
        setChanged: changed => dispatch(setChanged(changed)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerWrapper);
};

export default DebuggerHOC;
