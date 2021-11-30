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

const DebuggerHOC = function (WrappedComponent) {
    class DebuggerWrapper extends React.Component {
        constructor (props) {
            super(props);

            // Change the `debugMode` to false every time a new project
            // gets loaded in the VM runtime.
            this.props.vm.runtime.on('PROJECT_LOADED', this.props.onProjectLoaded);
        }

        async componentDidUpdate (prevProps) {
            if (prevProps.debugMode !== this.props.debugMode) {
                await this.changeDebugMode();
            }
        }

        /**
         * Method executed whenever the `debugMode` state variable changes.
         */
        async changeDebugMode () {
            this.props.vm.stopAll();

            if (this.props.debugMode) {
                const context = new Context();
                this.props.setContext(context);

                // Set up the current VM as the VM used in the context.
                await context.initialiseVm(this.props.vm);

                // Increase the length of the time slider every time a new frame gets added to the log.
                const oldFunction = context.log.addFrame.bind(context.log);
                context.log.addFrame = (_context, _block) => {
                    oldFunction(_context, _block);

                    this.props.setTimeFrame(this.props.numberOfFrames);
                    this.props.setNumberOfFrames(this.props.numberOfFrames + 1);
                };

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
                'animationSkinId',
                'context',
                'debugMode',
                'intervalIndex',
                'numberOfFrames',
                'running',
                'trailSkinId',
                'vm',
                'onProjectLoaded',
                'setAnimationSkinId',
                'setContext',
                'setNumberOfFrames',
                'setTimeFrame',
                'setTrailSkinId'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerWrapper.propTypes = {
        animationSkinId: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        intervalIndex: PropTypes.number,
        numberOfFrames: PropTypes.number.isRequired,
        running: PropTypes.bool.isRequired,
        trailSkinId: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        onProjectLoaded: PropTypes.func.isRequired,
        setAnimationSkinId: PropTypes.func.isRequired,
        setContext: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired,
        setTrailSkinId: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        animationSkinId: state.scratchGui.debugger.animationSkinId,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        intervalIndex: state.scratchGui.debugger.intervalIndex,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        running: state.scratchGui.vmStatus.running,
        trailSkinId: state.scratchGui.debugger.trailSkinId,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        onProjectLoaded: () => dispatch(setDebugMode(false)),
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
