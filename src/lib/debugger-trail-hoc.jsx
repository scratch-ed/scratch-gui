import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from '@ftrprf/judge-core';
import {
    disableAnimation,
    enableAnimation,
    setAnimationSkinId,
    setTrailSkinId
} from '../reducers/debugger.js';
import {
    findSpriteLog,
    positionsAreEqual,
    updateSprite
} from '../util.js';
import VM from 'scratch-vm';
import bindAll from 'lodash.bindall';

const DebuggerTrailHOC = function (WrappedComponent) {
    class DebuggerTrailWrapper extends React.Component {
        constructor (props) {
            super(props);

            // The time interval after which the animation must be updated (in ms).
            this.ANIMATION_INTERVAL = 100;
            // Index corresponding to the interval for the animation.
            this.intervalIndex = null;

            // Indicates for each sprite which trail index should be animated.
            this.animateIndex = {};
            // Contains a trail of log frame indices for each sprite.
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
            if (prevProps.debugMode !== this.props.debugMode) {
                if (this.props.debugMode) {
                    this.createSkins();
                    this.intervalIndex = setInterval(this.updateAnimation, this.ANIMATION_INTERVAL);

                    this.props.enableAnimation();
                } else {
                    this.props.disableAnimation();

                    clearInterval(this.intervalIndex);
                    this.destroySkins();

                    this.clearTrail();
                }
            }

            if (this.props.debugMode) {
                if (prevProps.running !== this.props.running) {
                    if (this.props.running) {
                        this.clearSkins();
                    } else {
                        this.loadLogFrame();
                        this.redrawTrails();
                    }
                }

                if (!this.props.running && (prevProps.timeFrame !== this.props.timeFrame)) {
                    this.loadLogFrame();
                    // this.redrawTrails();
                }

                if (!this.props.running && (prevProps.trailLength !== this.props.trailLength)) {
                    this.redrawTrails();
                }
            }
        }

        /**
         * Clear the object containing the trail indices for each sprite and
         * the object containing the current animation index for each sprite.
         */
        clearTrail () {
            this.animateIndex = {};
            this.trail = {};
        }

        /**
         * Create the pen skins for drawing and animating the trail.
         */
        createSkins () {
            // Initialize the pen skin and pen layer to draw the trail on.
            const trailSkinId = this.props.vm.renderer.createPenSkin();
            this.props.vm.renderer.updateDrawableSkinId(this.props.vm.renderer.createDrawable('pen'), trailSkinId);
            this.props.setTrailSkinId(trailSkinId);

            // Initialize the pen skin and pen layer to draw the animations on.
            const animationSkinId = this.props.vm.renderer.createPenSkin();
            this.props.vm.renderer.updateDrawableSkinId(this.props.vm.renderer.createDrawable('pen'), animationSkinId);
            this.props.setAnimationSkinId(animationSkinId);
        }

        /**
         * Destroy the pen skins for drawing and animating the trail.
         */
        destroySkins () {
            // Destroy the skins for trail and animation.
            this.props.vm.renderer.destroySkin(this.props.trailSkinId);
            this.props.vm.renderer.destroySkin(this.props.animationSkinId);
        }

        /**
         * Clear the pen skins for drawing and animating the trail.
         */
        clearSkins () {
            this.props.vm.renderer.penClear(this.props.trailSkinId);
            this.props.vm.renderer.penClear(this.props.animationSkinId);
        }

        loadClones () {
            for (const spriteLog of this.props.context.log.frames[this.props.timeFrame].sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    // Remove all clones of the current sprite that is not the sprite itself.
                    for (const clone of sprite.sprite.clones) {
                        if (!clone.isOriginal) {
                            this.props.vm.runtime.disposeTarget(clone);
                        }
                    }

                    // Initialize all clones of the current sprite.
                    for (const cloneLog of spriteLog.clones) {
                        const clone = sprite.makeClone(false);

                        this.props.vm.runtime.addTarget(clone);
                        clone.goBehindOther(sprite);

                        updateSprite(clone, cloneLog);
                    }
                }
            }
        }

        loadSprites () {
            for (const spriteLog of this.props.context.log.frames[this.props.timeFrame].sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSprite(sprite, spriteLog);
                }
            }
        }

        loadLogFrame () {
            this.loadSprites();
            this.loadClones();
        }

        /**
         * For each sprite in the current log frame,
         * draw a trail of previous positions (and states)
         * and store the indices of the log frames corresponding to the trail.
         */
        redrawTrails () {
            if (this.props.numberOfFrames === 0) {
                return;
            }

            this.clearSkins();
            this.clearTrail();

            const frame = this.props.context.log.frames[this.props.timeFrame];

            for (const spriteLog of frame.sprites) {
                if (spriteLog.isStage) {
                    continue;
                }

                const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    // Store the current ghost value of the sprite.
                    const ghostValue = sprite.effects.ghost;

                    this.trail[sprite.id] = [];

                    let currentIndex = this.props.timeFrame - 1;
                    let previousPosition = [spriteLog.x, spriteLog.y];
                    let renderedAmount = 0;

                    while (renderedAmount < this.props.trailLength && currentIndex >= 0) {
                        const currentFrame = this.props.context.log.frames[currentIndex];
                        const currentSpriteLog = findSpriteLog(currentFrame, sprite.id);

                        const currentPosition = [currentSpriteLog.x, currentSpriteLog.y];

                        if (!positionsAreEqual(previousPosition, currentPosition)) {
                            updateSprite(sprite, currentSpriteLog);

                            sprite.setEffect('ghost', 90);
                            this.props.vm.renderer.penStamp(this.props.trailSkinId, sprite.drawableID);

                            this.trail[sprite.id].unshift(currentIndex);
                            previousPosition = currentPosition;
                            renderedAmount++;
                        }

                        currentIndex--;
                    }

                    // Restore the ghost value of the sprite.
                    sprite.setEffect('ghost', ghostValue);
                }
            }

            this.loadSprites();
        }

        updateAnimation () {
            if (!this.props.animate || this.props.running || this.props.numberOfFrames === 0) {
                return;
            }

            this.props.vm.renderer.penClear(this.props.animationSkinId);

            for (const spriteId in this.trail) {
                if (this.trail[spriteId].length !== 0) {
                    const animateIndex = this.animateIndex[spriteId] ? this.animateIndex[spriteId] : 0;
                    const frameIndex = this.trail[spriteId][animateIndex];

                    const spriteLog = findSpriteLog(this.props.context.log.frames[frameIndex], spriteId);
                    const sprite = this.props.vm.runtime.getTargetById(spriteId);

                    if (sprite) {
                        // Store the current ghost value of the sprite.
                        const ghostValue = sprite.effects.ghost;

                        updateSprite(sprite, spriteLog);

                        sprite.setEffect('ghost', 50);
                        this.props.vm.renderer.penStamp(this.props.animationSkinId, sprite.drawableID);

                        // Restore the ghost value of the current sprite.
                        sprite.setEffect('ghost', ghostValue);
                    }

                    this.animateIndex[spriteId] = (animateIndex + 1) % this.trail[spriteId].length;
                }
            }

            this.loadSprites();
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
                'setAnimationSkinId',
                'setTrailSkinId'
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
        setAnimationSkinId: PropTypes.func.isRequired,
        setTrailSkinId: PropTypes.func.isRequired
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
        setAnimationSkinId: animationSkinId => dispatch(setAnimationSkinId(animationSkinId)),
        setTrailSkinId: trailSkinId => dispatch(setTrailSkinId(trailSkinId))
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerTrailWrapper);
};

export default DebuggerTrailHOC;
