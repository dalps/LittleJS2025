import * as LJS from "littlejsengine";
import { Ease, Tween } from "./tween";
import { currentSong } from "./main";
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

export const changeBackground = (color = currentSong.color) =>
  new Tween(
    (t) => LJS.setCanvasClearColor(LJS.canvasClearColor.lerp(color, t)),
    0,
    1,
    20
  ).setEase(Ease.OUT(Ease.BOUNCE));

export const cameraZoom = ({
  delta = 1,
  ease = Ease.OUT(Ease.POWER(3)),
  duration = 10,
} = {}) =>
  new Tween(
    (v) => LJS.setCameraScale(v),
    LJS.cameraScale,
    LJS.cameraScale + delta,
    duration
  ).setEase(ease);
