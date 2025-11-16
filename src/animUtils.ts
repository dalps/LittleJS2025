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

export const shake = (
  posRef: LJS.Vector2,
  { period = 5, delta = vec2(5, 0), times = 5 } = {}
) =>
  new Tween(
    (t) => posRef.setFrom(posRef.add(delta.scale(t))),
    -1,
    1,
    period
  ).then(Tween.PingPong(times));

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

export const impulse = ({
  start = 1,
  end = 1.2,
  duration = 3,
  fn = (t: number) => {},
} = {}) => {
  new Tween(fn, start, end, duration).then(Tween.PingPong(2));
};

export const uiBopScale = (
  obj: LJS.UIObject,
  { song = currentSong, delta = 0.2 } = {}
) => {
  const startSize = obj.size.copy();
  const setSize = (t: number) => {
    obj.size = startSize.scale(t);
  };
  song.beat.onbeat(() => impulse({ start: 1, end: 1 + delta, fn: setSize }));
};
