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
    setTimeFrame,
    setRemoveFuture
} from '../reducers/debugger.js';
import {createContextWithVm, Context, snapshotFromVm} from '@ftrprf/judge-core';
import omit from 'lodash.omit';
import bindAll from 'lodash.bindall';

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
                this.proxyRegisterEvent(this.props.context);
            }
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode || this.props.removeFuture !== nextProps.removeFuture;
        }

        async componentDidUpdate (prevProps) {
            if (prevProps.debugMode !== this.props.debugMode) {
                await this.changeDebugMode();
            }
            if (this.props.debugMode && this.props.removeFuture && !prevProps.removeFuture) {
                // If changed, remove full history
                this.removeFuture();
                this.props.setRemoveFuture(false);
            }
        }

        componentWillUnmount () {
            this.removeListeners();

            if (this.props.debugMode) {
                this.props.context.log.registerSnapshot = this.oldRegisterEvent;
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

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        handleProjectChanged () {
            if (this.props.debugMode) {
                this.props.vm.runtime.pause();
                this.props.setChanged(true);
            }
        }

        removeFuture () {
            if (this.props.numberOfFrames > 1) {
                this.props.context.setLogRange(0, this.props.timeFrame + 1);
                this.props.setNumberOfFrames(this.props.context.log.ops.length);
            }
        }

        /*
         * Removes everything except for the current and next frame
         */
        removeFullHistory () {
            if (this.props.numberOfFrames > 1) {
                this.props.context.setLogRange(this.props.timeFrame, this.props.timeFrame + 2);
                this.props.setNumberOfFrames(this.props.context.log.ops.length);
            }
        }

        proxyRegisterEvent (context) {
            // Increase the length of the time slider every time a new frame gets added to the log.
            this.oldRegisterEvent = context.log.registerEvent;
            context.log.registerEvent = new Proxy(this.oldRegisterEvent, {
                apply: (target, thisArg, argArray) => {
                    const added = target.apply(thisArg, argArray);
                    if (added && argArray[0].type === 'ops') {
                        // The debugger UI needs to reflect the new log entry
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

        async changeDebugMode () {
            if (this.props.debugMode) {
                const context = await createContextWithVm(this.props.vm);
                context.instrumentVm('debugger');
                context.log.started = true;
                const snapshot = snapshotFromVm(this.props.vm);
                context.log.registerStartSnapshots(snapshot, snapshot);
                this.props.setContext(context);

                this.proxyRegisterEvent(context);
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
                'setContext',
                'setDebugMode',
                'setNumberOfFrames',
                'setPaused',
                'setChanged',
                'setRemoveFuture',
                'setTimeFrame',
                'changed',
                'removeFuture'
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
        setContext: PropTypes.func.isRequired,
        setDebugMode: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setChanged: PropTypes.func.isRequired,
        setRemoveFuture: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired,
        changed: PropTypes.bool.isRequired,
        removeFuture: PropTypes.bool.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        timeFrame: state.scratchGui.debugger.timeFrame,
        changed: state.scratchGui.debugger.changed,
        removeFuture: state.scratchGui.debugger.removeFuture,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        setContext: context => dispatch(setContext(context)),
        setDebugMode: debugMode => dispatch(setDebugMode(debugMode)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setPaused: paused => dispatch(setPaused(paused)),
        setChanged: changed => dispatch(setChanged(changed)),
        setRemoveFuture: removeFuture => dispatch(setRemoveFuture(removeFuture)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerWrapper);
};

export default DebuggerHOC;
