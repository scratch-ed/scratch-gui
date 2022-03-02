import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    setContext,
    setDebugMode,
    setPaused,
    setNumberOfFrames,
    setTimeFrame
} from '../reducers/debugger.js';
import {Context} from '@ftrprf/judge-core';
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
                'handleProjectResumed'
            ]);

            this.props.vm.runtime.addListener('DEBUG_MODE_DISABLED', this.handleDebugModeDisabled);
            this.props.vm.runtime.addListener('DEBUG_MODE_ENABLED', this.handleDebugModeEnabled);
            this.props.vm.runtime.addListener('PROJECT_LOADED', this.handleProjectLoaded);
            this.props.vm.runtime.addListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.addListener('PROJECT_RESUMED', this.handleProjectResumed);
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode || this.props.running !== nextProps.running;
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

            if (prevProps.running !== this.props.running) {
                if (this.props.running) {
                    // Unpause the runtime when (re)starting the execution.
                    this.props.vm.runtime.resume();

                    // Clear the log when (re)starting the execution in debug mode.
                    if (this.props.debugMode) {
                        this.props.context.log.reset();

                        this.props.setTimeFrame(0);
                        this.props.setNumberOfFrames(0);
                    }
                }
            }
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

        async changeDebugMode () {
            this.props.vm.stopAll();

            if (this.props.debugMode) {
                const context = new Context();
                this.props.setContext(context);

                // Increase the length of the time slider every time a new frame gets added to the log.
                const oldAddFrame = context.log.addFrame.bind(context.log);
                context.log.addFrame = (_context, _block) => {
                    oldAddFrame(_context, _block);

                    this.props.setTimeFrame(this.props.numberOfFrames);
                    this.props.setNumberOfFrames(this.props.numberOfFrames + 1);
                };

                await context.initialiseVm(this.props.vm);
            } else {
                // Restore the VM to the state before the creation of the current context.
                await this.props.context.restoreVm();

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
                'running',
                'timeFrame',
                'vm',
                'activateTab',
                'setContext',
                'setDebugMode',
                'setNumberOfFrames',
                'setPaused',
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
        running: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        activateTab: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setDebugMode: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        running: state.scratchGui.vmStatus.running,
        timeFrame: state.scratchGui.debugger.timeFrame,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        activateTab: tab => dispatch(activateTab(tab)),
        setContext: context => dispatch(setContext(context)),
        setDebugMode: debugMode => dispatch(setDebugMode(debugMode)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setPaused: paused => dispatch(setPaused(paused)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerWrapper);
};

export default DebuggerHOC;
