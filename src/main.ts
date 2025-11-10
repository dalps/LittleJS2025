"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { changeBackground, impulse, pulse, sleep } from "./animUtils";
import { PatternWrapping } from "./beat";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import {
  initLevels,
  createLevelsMenu,
  levelsMenu,
  pauseBtn,
  storeKey,
  tutorialLevel,
} from "./levels";
import { DEG2RAD, getQuadrant, LOG, polar, rgba, setAlpha } from "./mathUtils";
import type { Song } from "./music";
import { emitter } from "./particleUtils";
import { sfx } from "./sfx";
import * as songs from "./songs";
import { hasDoneTutorial, tutorial } from "./tutorial";
import { Ease, Tween } from "./tween";
import { createPauseMenu, createTitleMenu, pauseMenu, startBtn } from "./ui";
import { ScreenButton } from "./uiUtils";
const { vec2, rgb, tile, time } = LJS;

export const DEBUG = true;

export const ratings = {
  superb: {
    message: `Superb!`,
    threshold: 0.8,
    color1: rgba(203, 26, 138, 1),
    color2: rgba(243, 21, 209, 1),
  },
  ok: {
    message: `Good enough.`,
    threshold: 0.5,
    color1: rgba(57, 243, 156, 1),
    color2: rgba(3, 184, 138, 1),
  },
  tryAgain: {
    message: `Try again :(`,
    threshold: 0,
    color1: rgba(26, 120, 203, 1),
    color2: rgba(102, 207, 255, 1),
  },
};

export let currentSong: Song;

export function setCurrentSong(song: Song) {
  currentSong?.stop();
  currentSong = song;
}

export enum GameState {
  Loading,
  AwaitClick,
  Title,
  Game,
  LevelSelection,
  Tutorial,
  Paused,
  GameResults,
}

export let gameState: GameState = GameState.Loading;

export function setGameState(state: GameState) {
  gameState = state;
}

export let playerColor: LJS.Color;

export function setPlayerColor(color: LJS.Color) {
  player && (player.color = color);
  localStorage.setItem(storeKey("player", "color"), color.toString());
}

export let titleSong: keyof typeof songs = "paarynasAllrite";

export const atlasCoords = {
  swim: [vec2(0, 0), 0],
  idle: [vec2(0, 1), 0],
  bump: [vec2(0, 2), 0],
  blink: [vec2(8, 1), 0],
  bubble: [vec2(0, 0), 2],
  smiley_happy: [vec2(3, 1), 2],
  smiley_smile: [vec2(4, 1), 2],
  smiley_frown: [vec2(5, 1), 2],
  die: [vec2(6, 1), 2],
  microbe_bw: [vec2(9, 1), 2],
  hoop_metronome: [vec2(1, 0), 2],
  hoop_click: [vec2(2, 0), 2],
  note1: [vec2(7, 1), 2],
  note2: [vec2(8, 1), 2],
  star: [vec2(2, 1), 2],
  check: [vec2(6, 0), 2],
  pause: [vec2(7, 0), 2],
  play: [vec2(8, 0), 2],
  github: [vec2(9, 0), 2],
};

export type AtlasKey = keyof typeof atlasCoords;
export type AtlasAnimationKey = keyof Pick<
  typeof atlasCoords,
  "blink" | "bump" | "swim" | "idle"
>;

export const spriteAtlas: Record<
  AtlasKey | `${AtlasAnimationKey}_tummy`,
  LJS.TileInfo
> = {};

export const font = "Averia Sans Libre";
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;
export let center: LJS.Vector2;
let leader: Microbe | undefined;

let matrixParticles: LJS.ParticleEmitter;
let musicVolume = 1;
let musicLoaded = false;
let percentLoaded = 0;
let player: Player;
let row: Microbe[] = [];

// ui
export let titleMenu: LJS.UIObject;
export let titleText: LJS.UIText;
let loadingText: LJS.UIText;
let foregroundCausticPos: LJS.Vector2 = vec2();
let backgroundCausticPos: LJS.Vector2 = vec2();

function loadAssets() {
  // init textures
  Object.entries(atlasCoords).forEach(([key, [coord, txtIdx]]) => {
    spriteAtlas[key as AtlasKey] = tile(coord, tileSize, txtIdx as number);
  });

  (["swim", "idle", "bump", "blink"] as AtlasAnimationKey[]).forEach(
    (animKey, idx) => {
      spriteAtlas[`${animKey}_tummy`] = tile(
        atlasCoords[animKey][0],
        tileSize,
        1
      );
    }
  );

  songs.initSongs();
  setCurrentSong(songs.paarynasAllrite);

  // game title & loading screen UI
  center = LJS.mainCanvasSize.scale(0.5);

  titleMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  titleText = new LJS.UIText(
    center.add(vec2(0, -100)),
    vec2(900, 90),
    "Small Row",
    "center"
  );
  let subtitle = new LJS.UIText(
    vec2(0, 70),
    vec2(900, 20),
    "Rhythm Heaven copycat · made for LittleJS 2025",
    "center"
  );

  titleText.textLineColor = LJS.WHITE;
  titleText.textLineWidth = 2;
  titleText.textColor = subtitle.textColor = LJS.WHITE;

  titleText.addChild(subtitle);
  // titleMenu.addChild(titleText);

  loadingText = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    LJS.mainCanvasSize,
    ""
  );
  loadingText.textColor = LJS.WHITE.copy();
  loadingText.textHeight = 42;
}

/**
 * Called after loading completes to await the user's click, which is necessary to wake up the AudioContext.
 */
function awaitClick() {
  setGameState(GameState.AwaitClick);

  new Tween((t) => (loadingText.textColor.a = t), 1, 0.1, 10) //
    .then(() => {
      loadingText.text = "Click to start";
      pulse(loadingText.textColor);
    });

  new ScreenButton(() => {
    loadingText.destroy();
    titleScreen();
  });
}

export function makeRow({
  angleDelta = 35 * DEG2RAD,
  startAngle = 0,
  startDist = 5,
  playerIdx = -1,
  length = 3,
  wrapping = PatternWrapping.End,
} = {}) {
  clearRow();

  leader = new Microbe(vec2(0, startDist), {
    rowIdx: 0,
    song: currentSong,
    wrapping,
  });
  row.push(leader);

  for (let rowIdx = 1; rowIdx < length; rowIdx++) {
    const startPos = polar(startAngle + angleDelta * -rowIdx, startDist);

    const m =
      rowIdx === playerIdx
        ? (player = new Player(startPos, {
            leader,
            rowIdx: rowIdx,
            song: currentSong,
            wrapping,
          }))
        : new Microbe(startPos, {
            leader,
            rowIdx: rowIdx,
            song: currentSong,
            wrapping,
          });

    row.push(m);
  }

  return row;
}

export function clearRow() {
  row.forEach((m) => m.destroy());
  row.splice(0);
  leader = undefined;
}

export function titleScreen() {
  setGameState(GameState.Title);

  pauseMenu.visible = levelsMenu.visible = false;
  titleMenu.visible = true;

  setCurrentSong(songs.paarynasAllrite);

  startBtn.onClick = startGame;
  const startBtnSize = startBtn.size.copy();
  const setSize = (t: number) => {
    startBtn.size = startBtnSize.scale(t);
  };
  let scaleDelta = 0.1;
  currentSong.beat.onbeat(() =>
    impulse({ start: 1, end: 1 + scaleDelta, fn: setSize })
  );

  currentSong.play({ loop: true });

  changeBackground();

  makeRow({ wrapping: PatternWrapping.Loop });

  matrixParticles = emitter({
    emitSize: 100,
    emitTime: 0,
    emitRate: 10,
    tileInfo: spriteAtlas["bubble"],
    sizeStart: 0.2,
    sizeEnd: 4.3,
    additive: true,
    renderOrder: -1e4,
  });

  row[1].addChild(matrixParticles);

  // for (let i = 0; i < 100; i++)
  //   new MyParticle(LJS.randInCircle(100, 0), {
  //     tileInfo: spriteAtlas["bubble"],
  //     sizeStart: LJS.rand(1, 10),
  //   });
}

function startGame() {
  if (!tutorialLevel.completed) return tutorial();

  levelsMenu.visible = true;
  titleText.visible = titleMenu.visible = false;
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  new LJS.UISystemPlugin();
  // new LJS.PostProcessPlugin(tvShader);

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  let storedColor = localStorage.getItem(storeKey("player", "color"));
  playerColor = storedColor ? new LJS.Color().setHex(storedColor) : LJS.RED;

  loadAssets();
  initLevels();
  createPauseMenu();
  createTitleMenu();
  createLevelsMenu();

  LJS.setTouchInputEnable(true);
  LJS.setSoundVolume(1);

  pauseMenu.visible = titleMenu.visible = levelsMenu.visible = false;
  // titleScreen();
  // levelSelection();
  // tutorial();

  center = LJS.mainCanvasSize.scale(0.5);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      if (currentSong?.sound?.isLoaded()) awaitClick();
      break;
    // LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
    case GameState.Title:
    case GameState.Tutorial:
    case GameState.LevelSelection:
    case GameState.Game:
      // LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
      // LJS.setCameraPos(player.pos);
      LJS.setCameraPos(row[1].pos);
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
    case GameState.Loading:
      const loadedPercent = (currentSong.sound.loadedPercent * 100) | 0;
      loadingText.text = `Loading music: ${loadedPercent}%`;
      break;

    case GameState.Game:
    // debugScore();

    case GameState.Title:
      const t = LJS.timeReal * 0.3;

      const color = rgba(255, 255, 255, 1);
      color.a = LJS.lerp(0.2, 0.5, 0.5 - LJS.cos(LJS.timeReal) * 0.5);

      const additiveColor = rgba(0, 119, 255, 1);
      additiveColor.a = LJS.lerp(
        0.02,
        0.05,
        0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5
      );

      LJS.drawTile(
        LJS.cameraPos.scale(0.7).add(vec2(-LJS.cos(t), LJS.sin(-t))),
        vec2(LJS.mainCanvasSize.scale(0.1).x),
        tile(vec2(), vec2(512), 3),
        color,
        0,
        false,
        additiveColor
      );

      break;
  }
}

function debugScore() {
  LJS.drawTextScreen(
    `Score: ${currentSong.metronome.score.toFixed(3)} / ${
      currentSong.totalSwims
    } (+ ${currentSong.scoreDelta.toFixed(3)})
Swim: ${currentSong.swimCount}
        `,
    vec2(20, 100),
    20,
    LJS.WHITE,
    undefined,
    undefined,
    "left"
  );
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  const causticTileSize = vec2(512);
  const causticRenderTileSize = vec2(LJS.mainCanvasSize.scale(0.1).x);
  const t = LJS.timeReal * 0.1;
  const [r, q] = getQuadrant(
    causticRenderTileSize.scale(2),
    LJS.cameraPos.subtract(causticRenderTileSize)
  );

  const color = rgba(255, 255, 255, 1);
  color.a = LJS.lerp(0.2, 0.5, 0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5);

  const additiveColor = rgba(0, 119, 255, 1);
  additiveColor.a = LJS.lerp(
    0.02,
    0.05,
    0.5 - LJS.cos(LJS.timeReal + Math.PI) * 0.5
  );

  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const offset = vec2(i, j).multiply(r).add(q);
      // const pos2 = LJS.cameraPos; // .scale(0.9).add(vec2(LJS.cos(t), LJS.sin(t)));
      LJS.drawTile(
        causticRenderTileSize.multiply(offset),
        causticRenderTileSize,
        tile(vec2(), causticTileSize, 3),
        color,
        Math.PI,
        false,
        additiveColor
      );
    }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  ["frames.png", "frames_tummy.png", "objects.png", "caustic4.png"]
);
