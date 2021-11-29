import React from 'react';
import DebuggerTabComponent from '../components/debugger-tab/debugger-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes, {number} from 'prop-types';
import VM from 'scratch-vm';

import {Context} from '@ftrprf/judge-core';
import {connect} from 'react-redux';
import {
    toggleDebugMode,
    setTrail,
    enableAnimation,
    disableAnimation,
    setAnimateIndex,
    setIntervalIndex,
    setTrailSkinId,
    setAnimationSkinId,
    setContext,
    setTimeFrame,
    setNumberOfFrames,
    resetTimeSlider,
    setTrailLength
} from '../reducers/debugger.js';
import {positionsAreEqual, updateSprite} from '../util.js';

class DebuggerTab extends React.Component {
    constructor (props) {
        super(props);

        bindAll(this, [
            'handleClickStep',
            'handleTimeInput',
            'handleTimeMouseDown',
            'handleTimeMouseUp',
            'handleToggle',
            'handleTrailInput',
            'handleTrailMouseDown',
            'handleTrailMouseUp',
            'updateAnimation'
        ]);

        // The time interval after which the animation must be updated (in ms).
        this.ANIMATION_INTERVAL = 100;
    }

    componentDidUpdate (prevProps) {
        if (this.props.debugMode && prevProps.running !== this.props.running) {
            this.updateSkins();
            return;
        }

        // If the time frame or trail length value changed, reset the current trail.
        if (this.props.debugMode && !this.props.running &&
            (prevProps.timeFrame !== this.props.timeFrame || prevProps.trailLength !== this.props.trailLength)) {
            this.resetTrail();
        }
    }

    removeAnimation () {
        this.props.context.vm.renderer.penClear(this.props.trailSkinId);
        this.props.context.vm.renderer.penClear(this.props.animationSkinId);

        this.props.disableAnimation();
        clearInterval(this.props.intervalIndex);
    }

    updateSkins () {
        if (this.props.running) {
            this.removeAnimation();
        } else {
            this.resetTrail();

            this.props.enableAnimation();
            this.props.setIntervalIndex(setInterval(this.updateAnimation, this.ANIMATION_INTERVAL));
        }
    }

    handleClickStep () {}

    handleTimeInput (event) {
        this.props.setTimeFrame(parseInt(event.target.value, 10));
    }

    handleTimeMouseDown () {
        if (!this.props.running) {
            this.props.disableAnimation();

            if (this.props.context) {
                this.props.context.vm.renderer.penClear(this.props.animationSkinId);
            }
        }
    }

    handleTimeMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    handleToggle () {
        this.props.toggleDebugMode();
    }

    handleTrailInput (event) {
        this.props.setTrailLength(parseInt(event.target.value, 10));
    }

    handleTrailMouseDown () {
        if (!this.props.running) {
            this.props.disableAnimation();

            if (this.props.context) {
                this.props.context.vm.renderer.penClear(this.props.animationSkinId);
            }
        }
    }

    handleTrailMouseUp () {
        if (!this.props.running) {
            this.props.enableAnimation();
        }
    }

    resetTrail () {
        if (!this.props.context || this.props.numberOfFrames < 1) {
            return;
        }

        this.props.setAnimateIndex(0);

        this.props.context.vm.renderer.penClear(this.props.trailSkinId);
        this.props.context.vm.renderer.penClear(this.props.animationSkinId);

        const previousPositions = new Map();

        let renderedAmount = 0;
        let currentIndex = this.props.timeFrame;

        const newTrail = [];

        while (renderedAmount < this.props.trailLength && currentIndex >= 0) {
            const frame = this.props.context.log.frames[currentIndex];

            for (const spriteLog of frame.sprites) {
                const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    const previousPosition = previousPositions.get(spriteLog.name);
                    const currentPosition = [spriteLog.x, spriteLog.y];

                    if (currentIndex !== this.props.timeFrame &&
                        !positionsAreEqual(previousPosition, currentPosition)
                    ) {
                        this.props.context.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 90);
                        previousPositions.set(spriteLog.name, currentPosition);

                        updateSprite(sprite, spriteLog);
                        this.props.context.vm.renderer.penStamp(this.props.trailSkinId, sprite.drawableID);
                        newTrail.unshift(currentIndex);
                        renderedAmount++;
                    }
                }
            }

            currentIndex--;
        }

        this.props.setTrail(newTrail);

        const frame = this.props.context.log.frames[this.props.timeFrame];
        for (const spriteLog of frame.sprites) {
            // Request the Target from the runtime by its name.
            const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);
            if (sprite) {
                this.props.context.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                updateSprite(sprite, spriteLog);
            }
        }
    }

    updateAnimation () {
        if (this.props.context && this.props.animate && this.props.trail.length > 0) {
            this.props.context.vm.renderer.penClear(this.props.animationSkinId);

            let frame = this.props.context.log.frames[this.props.trail[this.props.animateIndex]];

            for (const spriteLog of frame.sprites) {
                const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    this.props.context.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 50);
                    updateSprite(sprite, spriteLog);
                    this.props.context.vm.renderer.penStamp(this.props.animationSkinId, sprite.drawableID);
                }
            }

            frame = this.props.context.log.frames[this.props.timeFrame];
            for (const spriteLog of frame.sprites) {
                const sprite = this.props.context.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    this.props.context.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                    updateSprite(sprite, spriteLog);
                }
            }

            this.props.setAnimateIndex((this.props.animateIndex + 1) % this.props.trail.length);
        }
    }

    render () {
        return (
            <DebuggerTabComponent
                {...this.props}
                onClickStep={this.handleClickStep}
                onTimeInput={this.handleTimeInput}
                onTimeMouseDown={this.handleTimeMouseDown}
                onTimeMouseUp={this.handleTimeMouseUp}
                onToggle={this.handleToggle}
                onTrailInput={this.handleTrailInput}
                onTrailMouseDown={this.handleTrailMouseDown}
                onTrailMouseUp={this.handleTrailMouseUp}
                timeSliderDisabled={this.props.running}
            />
        );
    }
}

const mapStateToProps = state => ({
    running: state.scratchGui.vmStatus.running,
    debugMode: state.scratchGui.debugger.debugMode,
    trail: state.scratchGui.debugger.trail,
    animate: state.scratchGui.debugger.animate,
    animateIndex: state.scratchGui.debugger.animateIndex,
    intervalIndex: state.scratchGui.debugger.intervalIndex,
    trailSkinId: state.scratchGui.debugger.trailSkinId,
    animationSkinId: state.scratchGui.debugger.animationSkinId,
    submissionUpload: state.scratchGui.debugger.submissionUpload,
    context: state.scratchGui.debugger.context,
    timeFrame: state.scratchGui.debugger.timeFrame,
    numberOfFrames: state.scratchGui.debugger.numberOfFrames,
    trailLength: state.scratchGui.debugger.trailLength,
    timeSliderKey: state.scratchGui.debugger.timeSliderKey
});

const mapDispatchToProps = dispatch => ({
    toggleDebugMode: () => dispatch(toggleDebugMode()),
    setTrail: trail => dispatch(setTrail(trail)),
    enableAnimation: () => dispatch(enableAnimation()),
    disableAnimation: () => dispatch(disableAnimation()),
    setAnimateIndex: animateIndex => dispatch(setAnimateIndex(animateIndex)),
    setIntervalIndex: intervalIndex => dispatch(setIntervalIndex(intervalIndex)),
    setTrailSkinId: trailSkinId => dispatch(setTrailSkinId(trailSkinId)),
    setAnimationSkinId: animationSkinId => dispatch(setAnimationSkinId(animationSkinId)),
    setContext: context => dispatch(setContext(context)),
    setTimeFrame: timeFrame => dispatch(setTimeFrame(timeFrame)),
    setNumberOfFrames: numberOfFrames => dispatch(setNumberOfFrames(numberOfFrames)),
    resetTimeSlider: () => dispatch(resetTimeSlider()),
    setTrailLength: trailLength => dispatch(setTrailLength(trailLength))
});

DebuggerTab.propTypes = {
    // State
    running: PropTypes.bool.isRequired,
    debugMode: PropTypes.bool.isRequired,
    trail: PropTypes.arrayOf(number).isRequired,
    animate: PropTypes.bool.isRequired,
    animateIndex: PropTypes.number.isRequired,
    intervalIndex: PropTypes.number,
    trailSkinId: PropTypes.number,
    animationSkinId: PropTypes.number,
    context: PropTypes.instanceOf(Context),
    timeFrame: PropTypes.number.isRequired,
    numberOfFrames: PropTypes.number.isRequired,
    trailLength: PropTypes.number.isRequired,
    timeSliderKey: PropTypes.bool.isRequired,
    // Dispatch
    toggleDebugMode: PropTypes.func.isRequired,
    setTrail: PropTypes.func.isRequired,
    enableAnimation: PropTypes.func.isRequired,
    disableAnimation: PropTypes.func.isRequired,
    setAnimateIndex: PropTypes.func.isRequired,
    setIntervalIndex: PropTypes.func.isRequired,
    setTrailSkinId: PropTypes.func.isRequired,
    setAnimationSkinId: PropTypes.func.isRequired,
    setContext: PropTypes.func.isRequired,
    setTimeFrame: PropTypes.func.isRequired,
    setNumberOfFrames: PropTypes.func.isRequired,
    resetTimeSlider: PropTypes.func.isRequired,
    setTrailLength: PropTypes.func.isRequired,
    // Other props
    vm: PropTypes.instanceOf(VM).isRequired
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DebuggerTab);
