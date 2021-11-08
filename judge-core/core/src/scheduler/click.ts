import { ScheduledAction } from './action';
import { LogEvent, LogFrame } from '../log';
import { ThreadListener } from '../listener';
import { Context } from '../context';

const STAGE = 'Stage';

export class ClickSpriteAction extends ScheduledAction {
  sprite: string;

  constructor(spriteName: string) {
    super();
    this.sprite = spriteName;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    // Get the sprite
    let sprite;
    if (this.sprite !== STAGE) {
      sprite = context.vm!.runtime.getSpriteTargetByName(this.sprite);
    } else {
      sprite = context.vm!.runtime.getTargetForStage();
    }

    // Save the state of the sprite before the click event.
    const event = new LogEvent(context, 'click', { target: this.sprite });
    event.previousFrame = new LogFrame(context, 'click');
    context.log.addEvent(event);

    // Simulate mouse click by explicitly triggering click event on the target
    let list;
    if (this.sprite !== STAGE) {
      list = context.vm!.runtime.startHats(
        'event_whenthisspriteclicked',
        undefined,
        sprite,
      );
    } else {
      list = context.vm!.runtime.startHats('event_whenstageclicked', undefined, sprite);
    }

    const action = new ThreadListener(list);
    context.threadListeners.push(action);

    action.promise.then(() => {
      console.log(`finished click on ${this.sprite}`);
      // save sprites state after click
      event.nextFrame = new LogFrame(context, 'clickEnd');
      resolve(`finished ${this}`);
    });
  }

  toString(): string {
    return `${super.toString()} on ${this.sprite}`;
  }
}
