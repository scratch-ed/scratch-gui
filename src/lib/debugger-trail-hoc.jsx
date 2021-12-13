import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from '@ftrprf/judge-core';
import {disableAnimation, enableAnimation, setNumberOfFrames, setTimeFrame} from '../reducers/debugger.js';
import {findSpriteLog, positionsAreEqual, updateSprite} from '../util.js';
import VM from 'scratch-vm';
import bindAll from 'lodash.bindall';

const DebuggerTrailHOC = function (WrappedComponent) {
    class DebuggerTrailWrapper extends React.Component {
        constructor (props) {
            super(props);

            // The time interval after which the animation must be updated (in ms).
            this.ANIMATION_INTERVAL = 100;

            this.intervalIndex = null;
            this.animateIndex = {};
            this.trail = {};

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

                this.animateIndex = {};
                this.trail = {};

                this.props.setNumberOfFrames(0);
                this.props.setTimeFrame(0);
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
            if (this.props.numberOfFrames === 0) {
                return;
            }

            this.props.vm.renderer.penClear(this.props.trailSkinId);
            this.props.vm.renderer.penClear(this.props.animationSkinId);

            this.animateIndex = {};
            this.trail = {};

            let frame = this.props.context.log.frames[this.props.timeFrame];

            for (const spriteLog of frame.sprites) {
                const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    let currentIndex = this.props.timeFrame;
                    let previousPosition = [-1, -1];
                    let renderedAmount = 0;

                    this.trail[sprite.id] = [];

                    while (renderedAmount < this.props.trailLength && currentIndex >= 0) {
                        const currentFrame = this.props.context.log.frames[currentIndex];
                        const currentSpriteLog = findSpriteLog(currentFrame, sprite.id);

                        const currentPosition = [currentSpriteLog.x, currentSpriteLog.y];

                        if (currentIndex !== this.props.timeFrame &&
                            !positionsAreEqual(previousPosition, currentPosition)
                        ) {
                            this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 90);
                            updateSprite(sprite, currentSpriteLog);
                            this.props.vm.renderer.penStamp(this.props.trailSkinId, sprite.drawableID);

                            previousPosition = currentPosition;
                            this.trail[sprite.id].unshift(currentIndex);
                            renderedAmount++;
                        }

                        currentIndex--;
                    }
                }
            }

            frame = this.props.context.log.frames[this.props.timeFrame];

            for (const spriteLog of frame.sprites) {
                const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                    updateSprite(sprite, spriteLog);
                }
            }
        }

        updateAnimation () {
            if (!this.props.animate || this.props.numberOfFrames === 0) {
                return;
            }

            this.props.context.vm.renderer.penClear(this.props.animationSkinId);

            for (const spriteId in this.trail) {
                if (this.trail[spriteId].length > 0) {
                    const animateIndex = this.animateIndex[spriteId] ? this.animateIndex[spriteId] : 0;
                    const frameIndex = this.trail[spriteId][animateIndex];

                    const currentFrame = this.props.context.log.frames[frameIndex];
                    const spriteLog = findSpriteLog(currentFrame, spriteId);

                    const sprite = this.props.vm.runtime.getTargetById(spriteId);
                    if (sprite) {
                        this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 50);
                        updateSprite(sprite, spriteLog);
                        this.props.vm.renderer.penStamp(this.props.animationSkinId, sprite.drawableID);
                    }

                    this.animateIndex[spriteId] = (animateIndex + 1) % this.trail[spriteId].length;
                }
            }

            const currentFrame = this.props.context.log.frames[this.props.timeFrame];

            for (const spriteLog of currentFrame.sprites) {
                const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                    updateSprite(sprite, spriteLog);
                }
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
