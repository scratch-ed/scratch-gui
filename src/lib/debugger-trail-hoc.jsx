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
    isBitSet,
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
                        this.redrawTrails();
                    }
                }

                if (!this.props.running && (prevProps.timeFrame !== this.props.timeFrame)) {
                    this.loadLogFrame();
                    this.redrawTrails();
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

        loadSprites () {
            for (const spriteLog of this.props.context.log.frames[this.props.timeFrame].sprites) {
                const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    updateSprite(sprite, spriteLog);
                }
            }
        }

        loadLogFrame () {
            this.loadSprites();
        }

        /**
         * Return whether the drawable corresponding to 'drawableId' has the effect corresponding to
         * 'effectName' applied to it.
         *
         * @param {string} drawableId - id of the drawable
         * @param {string} effectName - name of the effect
         * @return {boolean} - whether the drawable has the effect applied to it
         */
        hasEffect (drawableId, effectName) {
            // Mapping from effect name to index in bit mask indicating
            // if drawable has certain effect.
            const effectPositions = {
                color: 0,
                fisheye: 1,
                whirl: 2,
                pixelate: 3,
                mosaic: 4,
                brightness: 5,
                ghost: 6
            };

            const position = effectPositions[effectName];
            const drawable = this.props.vm.renderer._allDrawables[drawableId];

            // No effect with given name or no drawable with given id.
            if (typeof position === 'undefined' || typeof drawable === 'undefined') {
                return false;
            }

            return isBitSet(position, drawable.enabledEffects);
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
                const sprite = this.props.vm.runtime.getSpriteTargetByName(spriteLog.name);

                if (sprite) {
                    // Store the current ghost value of the sprite.
                    const ghostValue = this.hasEffect(sprite.drawableID, 'ghost') ?
                        this.props.vm.renderer._allDrawables[sprite.drawableID]._uniforms.u_ghost :
                        -1;

                    this.trail[sprite.id] = [];

                    let currentIndex = this.props.timeFrame - 1;
                    let previousPosition = null;
                    let renderedAmount = 0;

                    while (renderedAmount < this.props.trailLength && currentIndex >= 0) {
                        const currentFrame = this.props.context.log.frames[currentIndex];
                        const currentSpriteLog = findSpriteLog(currentFrame, sprite.id);

                        const currentPosition = [currentSpriteLog.x, currentSpriteLog.y];

                        if (!positionsAreEqual(previousPosition, currentPosition)) {
                            this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 90);
                            updateSprite(sprite, currentSpriteLog);
                            this.props.vm.renderer.penStamp(this.props.trailSkinId, sprite.drawableID);

                            this.trail[sprite.id].unshift(currentIndex);

                            previousPosition = currentPosition;
                            renderedAmount++;
                        }

                        currentIndex--;
                    }

                    // Restore the ghost value of the current sprite.
                    if (ghostValue === -1) {
                        this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost');
                    } else {
                        this.props.vm.renderer._allDrawables[sprite.drawableID]._uniforms.u_ghost = ghostValue;
                    }
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
                        const ghostValue = this.hasEffect(sprite.drawableID, 'ghost') ?
                            this.props.vm.renderer._allDrawables[sprite.drawableID]._uniforms.u_ghost :
                            -1;

                        this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 50);
                        updateSprite(sprite, spriteLog);
                        this.props.vm.renderer.penStamp(this.props.animationSkinId, sprite.drawableID);

                        // Restore the ghost value of the current sprite.
                        if (ghostValue === -1) {
                            this.props.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost');
                        } else {
                            this.props.vm.renderer._allDrawables[sprite.drawableID]._uniforms.u_ghost = ghostValue;
                        }
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
