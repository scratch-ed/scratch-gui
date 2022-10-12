import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';
import PropTypes from 'prop-types';
import {Context} from '@ftrprf/judge-core';
import {disableAnimation, enableAnimation} from '../reducers/debugger.js';
import {
    positionsAreEqual,
    updateSpriteBubble,
    updateSpriteState,
    updateSpriteVariables
} from './time-slider-utility.js';
import VM from 'scratch-vm';
import bindAll from 'lodash.bindall';

const DebuggerTimeSliderHOC = function (WrappedComponent) {
    class DebuggerTimeSliderWrapper extends React.Component {
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

            this.trailSkinId = null;
            this.animationSkinId = null;

            bindAll(this, [
                'handleWorkspaceUpdate',
                'updateAnimation'
            ]);
        }

        componentDidMount () {
            this.props.vm.addListener('workspaceUpdate', this.handleWorkspaceUpdate);

            if (this.props.debugMode) {
                this.construct();

                if (this.props.rewindMode) {
                    this.redrawTrails();
                }
            }
        }

        shouldComponentUpdate (nextProps) {
            return this.props.debugMode !== nextProps.debugMode ||
                   this.props.rewindMode !== nextProps.rewindMode ||
                   this.props.timeFrame !== nextProps.timeFrame ||
                   this.props.trailLength !== nextProps.trailLength;
        }

        componentDidUpdate (prevProps) {
            if (prevProps.debugMode !== this.props.debugMode) {
                if (this.props.debugMode) {
                    this.construct();
                } else {
                    this.destruct();

                    if (this.props.rewindMode) {
                        this.props.vm.runtime.indicateBlock(
                            this.props.context.log.executions[this.props.timeFrame].data.blockId,
                            false
                        );
                    }
                }
            }

            if (this.props.debugMode && prevProps.rewindMode !== this.props.rewindMode) {
                if (this.props.rewindMode) {
                    this.loadLogFrame();
                    this.redrawTrails();
                    this.props.vm.runtime.indicateBlock(
                        this.props.context.log.ops[this.props.timeFrame].data.blockId,
                        true
                    );
                } else {
                    this.clearSkins();
                    this.props.vm.runtime.indicateBlock(
                        this.props.context.log.ops[this.props.timeFrame].data.blockId,
                        false
                    );
                }
            }

            if (this.props.debugMode && this.props.rewindMode) {
                if (prevProps.timeFrame !== this.props.timeFrame) {
                    this.loadLogFrame();
                    this.redrawTrails();
                    this.props.vm.runtime.indicateBlock(
                        this.props.context.log.ops[prevProps.timeFrame].data.blockId,
                        false
                    );
                    this.props.vm.runtime.indicateBlock(
                        this.props.context.log.ops[this.props.timeFrame].data.blockId,
                        true
                    );
                }

                if (prevProps.trailLength !== this.props.trailLength) {
                    this.redrawTrails();
                }
            }
        }

        componentWillUnmount () {
            this.props.vm.removeListener('workspaceUpdate', this.handleWorkspaceUpdate);

            if (this.props.debugMode) {
                this.destruct();
            }
        }

        construct () {
            this.createSkins();

            this.intervalIndex = setInterval(this.updateAnimation, this.ANIMATION_INTERVAL);
            this.props.enableAnimation();
        }

        destruct () {
            this.props.disableAnimation();
            clearInterval(this.intervalIndex);

            this.destroySkins();
        }

        handleWorkspaceUpdate () {
            if (this.props.rewindMode) {
                this.props.vm.runtime.indicateBlock(
                    this.props.context.log.ops[this.props.timeFrame].data.blockId,
                    true
                );
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
            this.trailSkinId = this.props.vm.renderer.createPenSkin();
            this.props.vm.renderer.updateDrawableSkinId(
                this.props.vm.renderer.createDrawable('pen'),
                this.trailSkinId
            );

            // Initialize the pen skin and pen layer to draw the animations on.
            this.animationSkinId = this.props.vm.renderer.createPenSkin();
            this.props.vm.renderer.updateDrawableSkinId(
                this.props.vm.renderer.createDrawable('pen'),
                this.animationSkinId
            );
        }

        /**
         * Destroy the pen skins for drawing and animating the trail.
         */
        destroySkins () {
            // Destroy the skins for trail and animation.
            this.props.vm.renderer.destroySkin(this.trailSkinId);
            this.props.vm.renderer.destroySkin(this.animationSkinId);

            this.trailSkinId = null;
            this.animationSkinId = null;
        }

        /**
         * Clear the pen skins for drawing and animating the trail.
         */
        clearSkins () {
            this.props.vm.renderer.penClear(this.trailSkinId);
            this.props.vm.renderer.penClear(this.animationSkinId);
        }

        loadClones () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    // Copy the list of clones in order to correctly remove all clones from the original list.
                    const currentClones = [...sprite.sprite.clones];

                    // Remove all clones of the current sprite that is not the sprite itself.
                    for (const clone of currentClones) {
                        if (!clone.isOriginal) {
                            this.props.vm.runtime.disposeTarget(clone);
                            this.props.vm.runtime.stopForTarget(clone);
                        }
                    }

                    // Initialize all clones of the current sprite.
                    for (const cloneLog of spriteLog.clones) {
                        const clone = sprite.makeClone();
                        // Store the most recent id of the clone in the log.
                        cloneLog.id = clone.id;

                        this.props.vm.runtime.addTarget(clone);
                        clone.goBehindOther(sprite);

                        updateSpriteState(clone, cloneLog);
                    }
                }
            }
        }

        loadSprites () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteState(sprite, spriteLog);
                }
            }
        }

        loadBubbles () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteBubble(sprite, spriteLog.bubbleState);

                    for (const cloneLog of spriteLog.clones) {
                        const clone = this.props.vm.runtime.getTargetById(cloneLog.id);

                        if (clone) {
                            updateSpriteBubble(clone, cloneLog.bubbleState);
                        }
                    }
                }
            }
        }

        loadVariables () {
            for (const spriteLog of this.props.context.log.ops[this.props.timeFrame].previous.sprites) {
                const sprite = this.props.vm.runtime.getTargetById(spriteLog.id);

                if (sprite) {
                    updateSpriteVariables(sprite, spriteLog.variables);
                }
            }
        }

        loadLogFrame () {
            this.loadClones();
            this.loadSprites();
            this.loadBubbles();
            this.loadVariables();
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

            const frame = this.props.context.log.ops[this.props.timeFrame].previous;

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
                        const currentSpriteLog = currentFrame.spriteById(sprite.id);

                        const currentPosition = [currentSpriteLog.x, currentSpriteLog.y];

                        if (!positionsAreEqual(previousPosition, currentPosition)) {
                            updateSpriteState(sprite, currentSpriteLog);

                            sprite.setEffect('ghost', 90);
                            this.props.vm.renderer.penStamp(this.trailSkinId, sprite.drawableID);

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
            if (!this.props.animate || !this.props.rewindMode || this.props.numberOfFrames === 0) {
                return;
            }

            this.props.vm.renderer.penClear(this.animationSkinId);

            for (const spriteId in this.trail) {
                if (this.trail[spriteId].length !== 0) {
                    const animateIndex = this.animateIndex[spriteId] ? this.animateIndex[spriteId] : 0;
                    const frameIndex = this.trail[spriteId][animateIndex];

                    const spriteLog = this.props.context.log.ops[frameIndex].previous.spriteById(spriteId);
                    const sprite = this.props.vm.runtime.getTargetById(spriteId);

                    if (sprite) {
                        // Store the current ghost value of the sprite.
                        const ghostValue = sprite.effects.ghost;

                        updateSpriteState(sprite, spriteLog);

                        sprite.setEffect('ghost', 50);
                        this.props.vm.renderer.penStamp(this.animationSkinId, sprite.drawableID);

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
                'context',
                'debugMode',
                'numberOfFrames',
                'timeFrame',
                'trailLength',
                'vm',
                'disableAnimation',
                'enableAnimation'
            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    DebuggerTimeSliderWrapper.propTypes = {
        animate: PropTypes.bool.isRequired,
        context: PropTypes.instanceOf(Context),
        debugMode: PropTypes.bool.isRequired,
        numberOfFrames: PropTypes.number.isRequired,
        rewindMode: PropTypes.bool.isRequired,
        timeFrame: PropTypes.number.isRequired,
        trailLength: PropTypes.number.isRequired,
        vm: PropTypes.instanceOf(VM).isRequired,
        disableAnimation: PropTypes.func.isRequired,
        enableAnimation: PropTypes.func.isRequired
    };

    const mapStateToProps = state => ({
        animate: state.scratchGui.debugger.animate,
        context: state.scratchGui.debugger.context,
        debugMode: state.scratchGui.debugger.debugMode,
        numberOfFrames: state.scratchGui.debugger.numberOfFrames,
        rewindMode: state.scratchGui.debugger.rewindMode,
        timeFrame: state.scratchGui.debugger.timeFrame,
        trailLength: state.scratchGui.debugger.trailLength,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        disableAnimation: () => dispatch(disableAnimation()),
        enableAnimation: () => dispatch(enableAnimation())
    });

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerTimeSliderWrapper);
};

export default DebuggerTimeSliderHOC;
