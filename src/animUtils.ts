import * as LJS from "littlejsengine";
import { Ease, Tween } from "./tween";
const { vec2, rgb, tile } = LJS;

export const sleep = (duration = 50) => new Tween(() => {}, 0, 0, duration);

export const pulse = (colorRef: LJS.Color, period = 30) =>
  new Tween((t) => (colorRef.a = t), 0, 1, period).then(Tween.PingPong);

export const blink = (colorRef: LJS.Color, period = 30) =>
  pulse(colorRef, period).setEase(
    Ease.PIECEWISE(
      () => 0,
      () => 1
    )
  );
