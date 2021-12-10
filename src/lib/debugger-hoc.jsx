import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import {
    setAnimationSkinId,
    setContext,
    setDebugMode,
    setNumberOfFrames,
    setTimeFrame,
    setTrailSkinId
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
                'handleProjectLoaded',
                'removeBreakpoint',
                'updateBreakpoints'
            ]);

            this.breakpoints = new Set();

            // Set breakpoints and initial debugMode.
            this.props.vm.runtime.sequencer.breakpoints = this.breakpoints;
            this.props.vm.runtime.sequencer.debugMode = this.props.debugMode;

            this.props.vm.addListener('PROJECT_LOADED', this.handleProjectLoaded);
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
            this.props.disableDebugMode();
            this.clearBreakpoints();
        }

        /**
         * Removes all current breakpoints.
         */
        clearBreakpoints () {
            this.breakpoints.clear();
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
         * If a breakpoint corresponding to `blockId` exists, it gets removed.
         * Else, a breakpoint for `blockId` gets added.
         * @param {string} blockId - id of block for which a breakpoint must be added/removed
         */
        updateBreakpoints (blockId) {
            if (!this.breakpoints.delete(blockId)) {
                this.breakpoints.add(blockId);
            }

            this.props.vm.emitWorkspaceUpdate();
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

                // Initialize the pen skin and pen layer to draw the trail on.
                const trailSkinId = context.vm.renderer.createPenSkin();
                context.vm.renderer.updateDrawableSkinId(context.vm.renderer.createDrawable('pen'), trailSkinId);
                this.props.setTrailSkinId(trailSkinId);

                // Initialize the pen skin and pen layer to draw the animations on.
                const animationSkinId = context.vm.renderer.createPenSkin();
                context.vm.renderer.updateDrawableSkinId(context.vm.renderer.createDrawable('pen'), animationSkinId);
                this.props.setAnimationSkinId(animationSkinId);
            } else {
                // Destroy the skins for trail and animation.
                this.props.vm.renderer.destroySkin(this.props.trailSkinId);
                this.props.vm.renderer.destroySkin(this.props.animationSkinId);

                // Restore the VM to the state before the creation of the current context.
                await this.props.context.restoreVm();

                this.props.setContext(null);
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'activeTab',
                'animationSkinId',
                'context',
                'debugMode',
                'intervalIndex',
                'numberOfFrames',
                'running',
                'timeFrame',
                'trailSkinId',
                'vm',
                'activateTab',
                'disableDebugMode',
                'removeAllBreakpoints',
                'setAnimationSkinId',
                'setContext',
                'setNumberOfFrames',
                'setTimeFrame',
                'setTrailSkinId'
            ]);

            return (
                <WrappedComponent
                    breakpoints={this.breakpoints}
                    removeBreakpoint={this.removeBreakpoint}
                    updateBreakpoints={this.updateBreakpoints}
                    {...componentProps}
                />
            );
        }
    }

    DebuggerWrapper.propTypes = {
        activeTab: PropTypes.number.isRequired,
        animationSkinId: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        intervalIndex: PropTypes.number,
        numberOfFrames: PropTypes.number.isRequired,
        running: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        trailSkinId: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        activateTab: PropTypes.func.isRequired,
        disableDebugMode: PropTypes.func.isRequired,
        setAnimationSkinId: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired,
        setTrailSkinId: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        activeTab: state.scratchGui.editorTab.activeTabIndex,
        animationSkinId: state.scratchGui.debugger.animationSkinId,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        intervalIndex: state.scratchGui.debugger.intervalIndex,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        running: state.scratchGui.vmStatus.running,
        timeFrame: state.scratchGui.debugger.timeFrame,
        trailSkinId: state.scratchGui.debugger.trailSkinId,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        activateTab: tab => dispatch(activateTab(tab)),
        disableDebugMode: () => dispatch(setDebugMode(false)),
        setAnimationSkinId: animationSkinId => dispatch(setAnimationSkinId(animationSkinId)),
        setContext: context => dispatch(setContext(context)),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
        setTrailSkinId: trailSkinId => dispatch(setTrailSkinId(trailSkinId))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerWrapper);
};

export default DebuggerHOC;
