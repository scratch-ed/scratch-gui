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
                'addBreakpoint',
                'handleProjectLoaded',
                'handleProjectPaused',
                'handleProjectResumed',
                'removeBreakpoint'
            ]);

            this.breakpoints = new Map();

            // Set breakpoints and initial debugMode.
            this.props.vm.runtime.sequencer.breakpoints = this.breakpoints;
            this.props.vm.runtime.sequencer.debugMode = this.props.debugMode;

            this.props.vm.runtime.addListener('PROJECT_LOADED', this.handleProjectLoaded);

            this.props.vm.runtime.addListener('PROJECT_PAUSED', this.handleProjectPaused);
            this.props.vm.runtime.addListener('PROJECT_RESUMED', this.handleProjectResumed);
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode || this.props.running !== nextProps.running;
        }

        async componentDidUpdate (prevProps) {
            if (this.props.debugMode && this.props.running && prevProps.running !== this.props.running) {
                for (let i = this.props.context.log.frames.length - 1; i > this.props.timeFrame; i--) {
                    this.props.context.log.frames.splice(i, 1);
                }

                this.props.setNumberOfFrames(this.props.context.log.frames.length);
            }

            if (prevProps.debugMode !== this.props.debugMode) {
                this.props.vm.runtime.sequencer.debugMode = this.props.debugMode;

                // If debugger tab is selected when debug mode gets disabled, switch active
                // tab to the blocks tab.
                if (!this.props.debugMode && this.props.activeTab === DEBUGGER_TAB_INDEX) {
                    this.props.activateTab(BLOCKS_TAB_INDEX);
                }

                await this.changeDebugMode();
            }
        }

        /**
         * When a new project gets loaded into the VM,
         * disable debug mode and clear the current set of breakpoints.
         */
        handleProjectLoaded () {
            const containsBreakpoints = this.breakpoints.size > 0;

            this.props.disableDebugMode();
            this.breakpoints.clear();

            // Manually trigger a workspace update to remove the red color
            // from blocks that contain a breakpoint. This is needed when the
            // current project gets loaded in again.
            if (containsBreakpoints) {
                this.props.vm.emitWorkspaceUpdate();
            }
        }

        handleProjectPaused () {
            this.props.setPaused(true);
        }

        handleProjectResumed () {
            this.props.setPaused(false);
        }

        /**
         * Adds a breakpoint for the block corresponding to `blockId`.
         * If this block already contains a breakpoint, this breakpoint gets overwritten.
         * @param {string} blockId - id of block whose breakpoint to remove
         * @param {string?} expression - optional expression used for conditional breakpoints
         */
        addBreakpoint (blockId, expression = '') {
            const value = {};

            this.breakpoints.set(blockId, value);
        }

        /**
         * Removes the breakpoint for the block corresponding to `blockId`.
         * If this block didn't contain a breakpoint, nothing happens.
         * @param {string} blockId - id of block whose breakpoint to remove
         */
        removeBreakpoint (blockId) {
            this.breakpoints.delete(blockId);
        }

        /**
         * Method executed whenever the `debugMode` state variable changes.
         */
        async changeDebugMode () {
            this.props.vm.stopAll();

            if (this.props.debugMode) {
                const context = new Context();
                this.props.setContext(context);

                // Increase the length of the time slider every time a new frame gets added to the log.
                const oldFunction = context.log.addFrame.bind(context.log);
                context.log.addFrame = (_context, _block) => {
                    oldFunction(_context, _block);

                    this.props.setTimeFrame(this.props.numberOfFrames);
                    this.props.setNumberOfFrames(this.props.numberOfFrames + 1);
                };

                // Set up the current VM as the VM used in the context.
                await context.initialiseVm(this.props.vm);
            } else {
                // Restore the VM to the state before the creation of the current context.
                await this.props.context.restoreVm();

                this.props.setContext(null);
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'activeTab',
                'context',
                'debugMode',
                'intervalIndex',
                'numberOfFrames',
                'running',
                'timeFrame',
                'vm',
                'activateTab',
                'disableDebugMode',
                'setContext',
                'setNumberOfFrames',
                'setPaused',
                'setTimeFrame'
            ]);

            return (
                <WrappedComponent
                    breakpoints={this.breakpoints}
                    addBreakpoint={this.addBreakpoint}
                    removeBreakpoint={this.removeBreakpoint}
                    {...componentProps}
                />
            );
        }
    }

    DebuggerWrapper.propTypes = {
        activeTab: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        intervalIndex: PropTypes.number,
        numberOfFrames: PropTypes.number.isRequired,
        running: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        activateTab: PropTypes.func.isRequired,
        disableDebugMode: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setPaused: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        intervalIndex: state.scratchGui.debugger.intervalIndex,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        running: state.scratchGui.vmStatus.running,
        timeFrame: state.scratchGui.debugger.timeFrame,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        activateTab: tab => dispatch(activateTab(tab)),
        disableDebugMode: () => dispatch(setDebugMode(false)),
        setContext: context => dispatch(setContext(context)),
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
