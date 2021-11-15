import React from 'react';
import DebuggerTabComponent from '../components/debugger-tab/debugger-tab.jsx';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

import {run, setupJudge} from '@ftrprf/judge-core';

class Waiter {
    constructor () {
        // eslint-disable-next-line no-unused-vars
        this.prom = new Promise((resolve, _) => {
            this.res = resolve;
        });
    }
}

class DebuggerTab extends React.Component {
    constructor (props) {
        super(props);

        this.vm = props.vm;

        this.submissionUpload = new Waiter();
        this.templateUpload = new Waiter();

        this.resetAnimation();

        this.ANIMATION_INTERVAL = 100;

        this.state = {
            codeString: '',
            maxTimeFrame: '0',
            timeFrame: '0',
            timeSliderDisabled: true,
            trailLength: '10',

            timeSliderKey: true // Small hack to reinitialize the time slider component.
        };

        bindAll(this, [
            'handleClickStart',
            'handleClickStop',
            'handleEditorChange',
            'handleSubmissionChange',
            'handleTemplateChange',
            'handleTimeInput',
            'handleTimeMouseDown',
            'handleTimeMouseUp',
            'handleTrailInput',
            'handleTrailMouseDown',
            'handleTrailMouseUp',
            'positionsAreEqual',
            'updateAnimation',
            'updateSprite'
        ]);
    }

    componentDidUpdate (_, prevState) {
        const {timeFrame: prevTimeFrame, trailLength: prevTrailLength} = prevState;
        const {timeFrame, trailLength} = this.state;

        // If the time or trail slider changed value, reset the current trail.
        if (prevTimeFrame !== timeFrame || prevTrailLength !== trailLength) {
            this.resetTrail();
        }
    }

    async handleClickStart () {
        clearInterval(this.animation);
        this.animation = null;

        this.resetAnimation();
        this.setState({
            numberOfFrames: 0,
            timeFrame: '0',
            timeSliderDisabled: true,
            trailLength: '10',

            timeSliderKey: !this.state.timeSliderKey
        });

        const config = {
            submission: await this.submissionUpload.prom,
            template: await this.templateUpload.prom,
            canvas: this.vm.renderer.canvas,
            testPlan: this.state.codeString
        };

        const {
            context,
            judge,
            templateJson,
            submissionJson,
            testPlan
        } = await setupJudge(config, this.vm);

        this.context = context;
        this.judge = judge;

        const oldFunction = this.judge.log.addFrame.bind(this.judge.log);
        this.judge.log.addFrame = (_context, _block) => {
            oldFunction(_context, _block);

            const {numberOfFrames} = this.state;
            this.setState({numberOfFrames: numberOfFrames + 1});
        };

        // Initialize the pen skin and pen layer to draw the trail on.
        this.trailSkinId = this.judge.vm.renderer.createPenSkin();
        this.judge.vm.renderer.updateDrawableSkinId(this.judge.vm.renderer.createDrawable('pen'), this.trailSkinId);

        // Initialize the pen skin and pen layer to draw the animations on.
        this.animationSkinId = this.judge.vm.renderer.createPenSkin();
        this.judge.vm.renderer.updateDrawableSkinId(this.judge.vm.renderer.createDrawable('pen'), this.animationSkinId);

        const evalInput = {
            templateJson,
            submissionJson,
            testPlan
        };

        await run(evalInput, this.context, this.judge);
    }

    handleClickStop () {
        if (!this.animation) {
            this.animation = setInterval(this.updateAnimation, this.ANIMATION_INTERVAL);
        }

        if (this.judge) {
            this.setState({timeSliderDisabled: false});

            this.judge.output.closeJudgement();
            this.judge.vm.stopAll();
        }
    }

    handleEditorChange (newValue) {
        this.setState({codeString: newValue});
    }

    handleSubmissionChange (proxy) {
        const reader = new FileReader();
        const thisFileInput = proxy.target;
        reader.onload = () => {
            this.submissionUpload.res(reader.result);
        };
        reader.readAsArrayBuffer(thisFileInput.files[0]);
    }

    handleTemplateChange (proxy) {
        const reader = new FileReader();
        const thisFileInput = proxy.target;
        reader.onload = () => {
            this.templateUpload.res(reader.result);
        };
        reader.readAsArrayBuffer(thisFileInput.files[0]);
    }

    handleTimeInput (event) {
        this.setState({timeFrame: event.target.value});
    }

    handleTimeMouseDown () {
        this.animate = false;
        this.judge.vm.renderer.penClear(this.animationSkinId);
    }

    handleTimeMouseUp () {
        this.animate = true;
    }

    handleTrailInput (event) {
        this.setState({trailLength: event.target.value});
    }

    handleTrailMouseDown () {
        this.animate = false;
        this.judge.vm.renderer.penClear(this.animationSkinId);
    }

    handleTrailMouseUp () {
        this.animate = true;
    }

    /**
     * Helper function to check if 2 positions are equal.
     *
     * @param {[number, number]} position1 - Base position.
     * @param {[number, number]} position2 - Position to compare with.
     * @returns {bool} - True if positions are equal, else false
     */
    positionsAreEqual (position1, position2) {
        if (!position1 || !position2 || position1.length !== 2 || position2.length !== 2) {
            return false;
        }

        const [x1, y1] = position1;
        const [x2, y2] = position2;

        return x1 === x2 && y1 === y2;
    }

    resetAnimation () {
        this.trail = [];
        this.animate = false;
        this.animateIndex = 0;
    }

    resetTrail () {
        this.trail = [];
        this.animateIndex = 0;

        this.judge.vm.renderer.penClear(this.trailSkinId);
        this.judge.vm.renderer.penClear(this.animationSkinId);

        const previousPositions = new Map();
        const frameIndex = parseInt(this.state.timeFrame, 10);
        const currentTrailLength = parseInt(this.state.trailLength, 10);

        let renderedAmount = 0;
        let currentIndex = frameIndex;
        while (renderedAmount < currentTrailLength && currentIndex >= 0) {
            const frame = this.judge.log.frames[currentIndex];

            for (const spriteLog of frame.sprites) {
                // Request the Target from the runtime by its name.
                const sprite = this.judge.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    const previousPosition = previousPositions.get(spriteLog.name);
                    const currentPosition = [spriteLog.x, spriteLog.y];

                    if (currentIndex !== frameIndex && !this.positionsAreEqual(previousPosition, currentPosition)) {
                        this.judge.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 90);
                        previousPositions.set(spriteLog.name, currentPosition);

                        this.updateSprite(sprite, spriteLog);
                        this.judge.vm.renderer.penStamp(this.trailSkinId, sprite.drawableID);
                        this.trail.unshift(currentIndex);
                        renderedAmount++;
                    }
                }
            }

            currentIndex--;
        }

        const frame = this.judge.log.frames[frameIndex];
        for (const spriteLog of frame.sprites) {
            // Request the Target from the runtime by its name.
            const sprite = this.judge.vm.runtime.getSpriteTargetByName(spriteLog.name);
            if (sprite) {
                this.judge.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                this.updateSprite(sprite, spriteLog);
            }
        }
    }

    updateAnimation () {
        if (this.animate && this.trail.length > 0 && this.judge) {
            this.judge.vm.renderer.penClear(this.animationSkinId);

            const index = this.trail[this.animateIndex];
            let frame = this.judge.log.frames[index];

            for (const spriteLog of frame.sprites) {
                // Request the Target from the runtime by its name
                const sprite = this.judge.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    this.judge.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 50);
                    this.updateSprite(sprite, spriteLog);
                    this.judge.vm.renderer.penStamp(this.animationSkinId, sprite.drawableID);
                }
            }

            frame = this.judge.log.frames[parseInt(this.state.timeFrame, 10)];
            for (const spriteLog of frame.sprites) {
                // Request the Target from the runtime by its name
                const sprite = this.judge.vm.runtime.getSpriteTargetByName(spriteLog.name);
                if (sprite) {
                    this.judge.vm.renderer.updateDrawableEffect(sprite.drawableID, 'ghost', 0);
                    this.updateSprite(sprite, spriteLog);
                }
            }

            this.animateIndex = (this.animateIndex + 1) % this.trail.length;
        }
    }

    /**
     * Update the sprite's position, direction and costume based on the information
     * stored in the logged sprite.
     *
     * @param {RenderedTarget} sprite - Sprite that needs to be updated.
     * @param {LoggedSprite} spriteLog - Logged sprite containing the new values.
     */
    updateSprite (sprite, spriteLog) {
        sprite.setXY(spriteLog.x, spriteLog.y);
        sprite.setDirection(spriteLog.direction);
        sprite.setCostume(sprite.getCostumeIndexByName(spriteLog.costume));
    }

    render () {
        const {
            codeString,
            numberOfFrames,
            timeFrame,
            timeSliderDisabled,
            timeSliderKey,
            trailLength
        } = this.state;

        return (
            <DebuggerTabComponent
                codeString={codeString}
                numberOfFrames={numberOfFrames}
                onClickStart={this.handleClickStart}
                onClickStop={this.handleClickStop}
                onEditorChange={this.handleEditorChange}
                onSubmissionChange={this.handleSubmissionChange}
                onTemplateChange={this.handleTemplateChange}
                onTimeInput={this.handleTimeInput}
                onTimeMouseDown={this.handleTimeMouseDown}
                onTimeMouseUp={this.handleTimeMouseUp}
                onTrailInput={this.handleTrailInput}
                onTrailMouseDown={this.handleTrailMouseDown}
                onTrailMouseUp={this.handleTrailMouseUp}
                timeFrame={timeFrame}
                timeSliderDisabled={timeSliderDisabled}
                timeSliderKey={timeSliderKey}
                trailLength={trailLength}
            />
        );
    }
}

DebuggerTab.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default DebuggerTab;
