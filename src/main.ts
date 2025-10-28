"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Beat } from "./beat";
import { AutoMicrobe } from "./entities/microbe_auto";
import { Player } from "./entities/player";
import { DEG2RAD } from "./mathUtils";
import { Metronome } from "./metronome";
import { createTitleUI } from "./ui";
const { vec2, rgb, tile, time } = LJS;

enum GameState {
  Loading,
  AwaitClick,
  Title,
}

export let globalBeat: Beat;
export let metronome: Metronome;
export let titleSong: LJS.SoundWave;
export let musicInstance: LJS.SoundInstance;
export let gameState: GameState = GameState.Loading;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
export const font = "Averia Sans Libre";
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;
export let center: LJS.Vector2;

let matrixParticles: LJS.ParticleEmitter;
let musicVolume = 1;
let musicLoaded = false;
let percentLoaded = 0;
let player: Player;
let bubbles = [];
let autoMicrobes = [];

function loadAssets() {
  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);
  titleSong = new LJS.SoundWave("/songs/paarynas-allrite.mp3");

  center = LJS.mainCanvasSize.scale(0.5);
}

// After loading finishes, await the user's click. This is essential to play
// music in the title screen
function awaitClick() {
  gameState = GameState.AwaitClick;

  const clickToPlay = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    vec2(1000, 90),
    "Click to start"
  );
  clickToPlay.textColor = LJS.WHITE;

  clickToPlay.onClick = () => {
    clickToPlay.destroy();
    titleScreen();
  };
}

function titleScreen() {
  gameState = GameState.Title;
  createTitleUI();

  globalBeat = new Beat(128, 4, 1);

  musicInstance = titleSong.playMusic(musicVolume);

  const metronomePos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.1));
  metronome = new Metronome(metronomePos, globalBeat);

  LJS.setTouchInputEnable(true);

  const startDist = 5;
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

function gameInit() {
  new LJS.UISystemPlugin();

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  loadAssets();

  // new LJS.UIText(
  //   LJS.mainCanvasSize.scale(0.5),
  //   vec2(1000, 50),
  //   "Click to start"
  // );
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      if (titleSong.isLoaded()) awaitClick();
      break;
    case GameState.Title:
      LJS.setCameraPos(player.pos);
      break;
  }
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
  switch (gameState) {
    case GameState.Loading: {
      const loadedPercent = (titleSong.loadedPercent * 100) | 0;
      LJS.drawTextScreen(
        `Loading music: ${loadedPercent}%`,
        LJS.mainCanvasSize.scale(0.5),
        50,
        LJS.WHITE
      );
      break;
    }

    case GameState.Title:
      bubbles.forEach(({ pos, size }) =>
        LJS.drawTile(pos, size, spriteAtlas["bubble"])
      );
      break;
  }
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
