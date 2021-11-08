import { ScheduledAction } from './action';
import { Context } from '../context';

export class SetSpritePositionAction extends ScheduledAction {
  sprite: string;
  x: number;
  y: number;
  constructor(spriteName: string, x: number, y: number) {
    super();
    this.sprite = spriteName;
    this.x = x;
    this.y = y;
  }

  execute(context: Context, resolve: (v: string) => void): void {
    const target = context.vm!.runtime.getSpriteTargetByName(this.sprite);
    if (!target) {
      throw new Error(`Could not find target ${this.sprite}`);
    }
    target.setXY(this.x, this.y);
    resolve(`finished ${this}`);
  }

  toString(): string {
    return `${super.toString()} on ${this.sprite} to (${this.x},${this.y})`;
  }
}
