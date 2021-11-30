import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from '@ftrprf/judge-core';
import {disableAnimation, enableAnimation, setNumberOfFrames, setTimeFrame} from '../reducers/debugger.js';
import {positionsAreEqual, updateSprite} from '../util.js';
import VM from 'scratch-vm';
import bindAll from 'lodash.bindall';

const DebuggerTrailHOC = function (WrappedComponent) {
    class DebuggerTrailWrapper extends React.Component {
        constructor (props) {
            super(props);

            // The time interval after which the animation must be updated (in ms).
            this.ANIMATION_INTERVAL = 100;

            this.animateIndex = 0;
            this.intervalIndex = null;
            this.trail = [];

            bindAll(this, [
                'updateAnimation'
            ]);
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode ||
                   this.props.running !== nextProps.running ||
                   this.props.timeFrame !== nextProps.timeFrame ||
                   this.props.trailLength !== nextProps.trailLength;
        }

        componentDidUpdate (prevProps) {
            if (this.props.debugMode) {
                if (prevProps.running !== this.props.running) {
                    this.updateSkins();
                    return;
                }

                if (!this.props.running &&
                    (prevProps.timeFrame !== this.props.timeFrame || prevProps.trailLength !== this.props.trailLength)
                ) {
                    this.resetTrail();
                }
            } else {
                // If debugMode gets disabled, remove the current trail and animation from the canvas.
                // The clear of the trail and animation skin is not necessarily needed, since the skins
                // wil be destroyed in the DebuggerHOC.
                this.clearSkins();

                this.animateIndex = 0;
                this.trail = [];

                this.props.setNumberOfFrames(0);
                this.props.setTimeFrame(-1);
            }
        }

        clearSkins () {
            if (this.props.animate) {
                this.props.vm.renderer.penClear(this.props.trailSkinId);
                this.props.vm.renderer.penClear(this.props.animationSkinId);

                this.props.disableAnimation();
                clearInterval(this.intervalIndex);
            }
        }

        updateSkins () {
            if (this.props.running) {
                this.clearSkins();
            } else {
                this.resetTrail();

                this.props.enableAnimation();
                this.intervalIndex = setInterval(this.updateAnimation, this.ANIMATION_INTERVAL);
            }
        }

        resetTrail () {
            // Log contains no frames.
            if (this.props.numberOfFrames <= 0) {
                return;
            }

            this.props.vm.renderer.penClear(this.props.trailSkinId);
            this.props.vm.renderer.penClear(this.props.animationSkinId);

            this.animateIndex = 0;
            this.trail = [];

            let renderedAmount = 0;
            const previousPositions = new Map();

            let currentIndex = this.props.timeFrame;
            while (renderedAmount < this.props.trailLength && currentIndex >= 0) {
                const frame = this.props.context.log.frames[currentIndex];

                for (const spriteLog of frame.sprites) {
                    const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);

                    if (sprite) {
                        const previousPosition = previousPositions.get(spriteLog.name);
                        const currentPosition = [spriteLog.x, spriteLog.y];

                        if (currentIndex !== this.props.timeFrame &&
                            !positionsAreEqual(previousPosition, currentPosition)
                        ) {
                            this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 90);
                            updateSprite(sprite, spriteLog);
                            this.props.vm.renderer.penStamp(this.props.trailSkinId, sprite.drawableID);

                            previousPositions.set(spriteLog.name, currentPosition);
                            this.trail.unshift(currentIndex);
                            renderedAmount++;
                        }
                    }
                }

                currentIndex--;
            }

            const frame = this.props.context.log.frames[this.props.timeFrame];
            for (const spriteLog of frame.sprites) {
                const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                    updateSprite(sprite, spriteLog);
                }
            }
        }

        updateAnimation () {
            if (this.props.animate && this.trail.length > 0) {
                this.props.context.vm.renderer.penClear(this.props.animationSkinId);

                let frame = this.props.context.log.frames[this.trail[this.animateIndex]];
                for (const spriteLog of frame.sprites) {
                    const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);
                    if (sprite) {
                        this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 50);
                        updateSprite(sprite, spriteLog);
                        this.props.vm.renderer.penStamp(this.props.animationSkinId, sprite.drawableID);
                    }
                }

                frame = this.props.context.log.frames[this.props.timeFrame];
                for (const spriteLog of frame.sprites) {
                    const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);
                    if (sprite) {
                        this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                        updateSprite(sprite, spriteLog);
                    }
                }

                this.animateIndex = (this.animateIndex + 1) % this.trail.length;
            }
        }

        render () {
            const componentProps = omit(this.props, [
                'animate',
                'animationSkinId',
                'context',
                'debugMode',
                'numberOfFrames',
                'running',
                'timeFrame',
                'trailLength',
                'trailSkinId',
                'vm',
                'disableAnimation',
                'enableAnimation',
                'setNumberOfFrames',
                'setTimeFrame'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerTrailWrapper.propTypes = {
        animate: PropTypes.bool.isRequired,
        animationSkinId: PropTypes.number.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        running: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        trailLength: PropTypes.number.isRequired,
        trailSkinId: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        disableAnimation: PropTypes.func.isRequired,
        enableAnimation: PropTypes.func.isRequired,
        setNumberOfFrames: PropTypes.func.isRequired,
        setTimeFrame: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        animate: state.scratchGui.debugger.animate,
        animationSkinId: state.scratchGui.debugger.animationSkinId,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        running: state.scratchGui.vmStatus.running,
        timeFrame: state.scratchGui.debugger.timeFrame,
        trailLength: state.scratchGui.debugger.trailLength,
        trailSkinId: state.scratchGui.debugger.trailSkinId,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        disableAnimation: () => dispatch(disableAnimation()),
        enableAnimation: () => dispatch(enableAnimation()),
        setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
        setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerTrailWrapper);
};

export default DebuggerTrailHOC;
