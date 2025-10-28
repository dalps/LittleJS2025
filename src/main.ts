"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Beat } from "./beat";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Player } from "./entities/player";
import { DEG2RAD } from "./mathUtils";
import { Metronome } from "./metronome";
import { createTitleUI, titleMenu } from "./ui";
const { vec2, rgb, tile, time } = LJS;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
let player: Player;

let bubbles = [];
let autoMicrobes = [];

export let globalBeat: Beat;
export let metronome: Metronome;

let matrixParticles: LJS.ParticleEmitter;
export const font = "Averia Sans Libre";
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // LJS.setCanvasFixedSize(vec2(1000));
  // LJS.setCanvasPixelated(false);

  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);

  createTitleUI();

  const startDist = 5;

  globalBeat = new Beat(60, 4, 2);
  const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.1));

  metronome = new Metronome(metronomePos, globalBeat);

  LJS.setTouchInputEnable(true);

  autoMicrobes.push(new AutoMicrobe(angleDelta, startDist));
  player = new AutoMicrobe(angleDelta * 2, startDist);
  autoMicrobes.push(player);
  autoMicrobes.push(new AutoMicrobe(angleDelta * 3, startDist));
  player.idle();

  // prettier-ignore
  matrixParticles = new LJS.ParticleEmitter(vec2(), 0, 100, 0, 10, 3.14, spriteAtlas["bubble"], new LJS.Color(1, 1, 1, 1), new LJS.Color(1, 1, 1, 1), new LJS.Color(0.439, 0.973, 0.361, 0), new LJS.Color(1, 1, 1, 0), 4.3, 0.2, 1, 0, 0, 1, 1, 0, 0, 0, 0, false, true, false, -1e4, false);

  player.addChild(matrixParticles);

  for (let i = 0; i < 100; i++) {
    const size = vec2(1).scale(LJS.rand(1, 5));
    const pos = LJS.randInCircle(100, 0);
    bubbles.push({ size, pos });
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  LJS.setCameraPos(player.pos);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
  bubbles.forEach(({ pos, size }) =>
    LJS.drawTile(pos, size, spriteAtlas["bubble"])
  );
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  // LJS.drawText(
  //   "The mitochondrion is the partyhouse of the cell",
  //   vec2(0.5, 0.5),
  //   1,
  //   LJS.WHITE,
  //   undefined,
  //   undefined,
  //   "center",
  //   font
  // );
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  ["frames.png", "frames_tummy.png", "objects.png"]
);
