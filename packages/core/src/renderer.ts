/* Copyright (C) 2019 Ghent University - All Rights Reserved */
import ScratchRender from 'scratch-render';
import { LogEvent, LogFrame } from './log';
import { Context } from './context';

/**
 * Intercept events from pen extension.
 *
 * @param {Context} context - The vm to intercept info from.
 * @param {ScratchRender} renderer - Renderer
 *
 * @see https://en.scratch-wiki.info/wiki/Pen_Extension
 */
function interceptPen(context: Context, renderer: ScratchRender) {
  console.log('Intercepting pen events...');

  // Intercept lines
  const oldLine = renderer.penLine;
  renderer.penLine = new Proxy(oldLine, {
    apply: function (target, thisArg, argumentsList) {
      const p1 = { x: argumentsList[2], y: argumentsList[3] };
      const p2 = { x: argumentsList[4], y: argumentsList[5] };
      const line = { start: p1, end: p2 };
      context.log.renderer.lines.push(line);
      const event = new LogEvent(context, 'renderer', {
        name: 'penLine',
        line: line,
        color: argumentsList[1].color4f,
      });
      event.previousFrame = new LogFrame(context, 'penLine');
      event.nextFrame = new LogFrame(context, 'penLineEnd');
      context.log.addEvent(event);

      return target.apply(thisArg, argumentsList);
    },
  });

  // Save the old version of penPoint in the function `penPointBase`
  renderer.penPointBase = renderer.penPoint;

  // Intercept points
  const penPointOld = renderer.penPoint;
  renderer.penPoint = new Proxy(penPointOld, {
    apply: function (target, thisArg, argumentsList) {
      console.log("In penPoint proxy");
      const point = { x: argumentsList[2], y: argumentsList[3] };
      context.log.renderer.points.push(point);
      const event = new LogEvent(context, 'renderer', {
        name: 'penPoint',
        point: point,
        color: argumentsList[1].color4f,
      });
      event.previousFrame = new LogFrame(context, 'penPoint');
      event.nextFrame = new LogFrame(context, 'penPointEnd');
      context.log.addEvent(event);

      return target.apply(thisArg, argumentsList);
    },
  });

  // Intercept clear
  const penClearOld = renderer.penClear;
  renderer.penClear = new Proxy(penClearOld, {
    apply: function (target, thisArg, argumentsList) {
      const event = new LogEvent(context, 'renderer', {
        name: 'penClear',
        previous: {
          lines: context.log.renderer.lines.slice(),
          points: context.log.renderer.points.slice(),
        },
      });
      context.log.renderer.lines = [];
      context.log.renderer.points = [];
      event.previousFrame = new LogFrame(context, 'penClear');
      event.nextFrame = new LogFrame(context, 'penClearEnd');
      context.log.addEvent(event);

      return target.apply(thisArg, argumentsList);
    },
  });
}

/**
 * Create a proxied renderer, allowing us to intercept various stuff.
 *
 * @param {Context} context - The context.
 * @param {HTMLCanvasElement} canvas - The canvas where the renderer should work.
 *
 * @return {ScratchRender}
 */
export function makeProxiedRenderer(
  context: Context,
  canvas: HTMLCanvasElement,
): ScratchRender {
  const render = new ScratchRender(canvas);
  console.log('Renderer created');

  interceptPen(context, render);

  // text bubble creation
  const createTextSkinOld = render.createTextSkin;
  render.createTextSkin = new Proxy(createTextSkinOld, {
    apply: function (target, thisArg, argumentsList) {
      const skinId = target.apply(thisArg, argumentsList);

      context.log.renderer.responses.push(argumentsList[1]);
      const event = new LogEvent(context, 'renderer', {
        id: skinId,
        name: 'createTextSkin',
        text: argumentsList[1],
      });
      event.previousFrame = new LogFrame(context, 'createTextSkin');
      event.nextFrame = new LogFrame(context, 'createTextSkinEnd');
      context.log.addEvent(event);

      return skinId;
    },
  });

  const updateTextSkinOld = render.updateTextSkin;
  render.updateTextSkin = new Proxy(updateTextSkinOld, {
    apply: function (target, thisArg, argumentsList) {
      context.log.renderer.responses.push(argumentsList[2]);
      const event = new LogEvent(context, 'renderer', {
        name: 'updateTextSkin',
        text: argumentsList[2],
      });
      event.previousFrame = new LogFrame(context, 'updateTextSkin');
      event.nextFrame = new LogFrame(context, 'updateTextSkinEnd');
      context.log.addEvent(event);

      return target.apply(thisArg, argumentsList);
    },
  });

  const destroySkinOld = render.destroySkin;
  render.destroySkin = new Proxy(destroySkinOld, {
    apply: function (target, thisArg, argumentsList) {
      const skinId = argumentsList[0];
      const event = new LogEvent(context, 'renderer', {
        name: 'destroySkin',
        id: skinId,
      });
      event.previousFrame = new LogFrame(context, 'destroySkin');
      event.nextFrame = new LogFrame(context, 'destroySkinEnd');
      context.log.addEvent(event);

      return target.apply(thisArg, argumentsList);
    },
  });

  return render;
}
