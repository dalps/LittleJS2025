"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import {
  cameraZoom,
  changeBackground,
  pulse,
  uiBopScale
} from "./animUtils";
import { beatCount, PatternWrapping } from "./beat";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import {
  createLevelsMenu,
  initLevels,
  levelSM,
  levelsMenu,
  pauseBtn,
  showLevels,
  storeKey,
  tutorialLevel
} from "./levels";
import { DEG2RAD, getQuadrant, polar, rgba, setAlpha } from "./mathUtils";
import type { Song } from "./music";
import { emitter } from "./particleUtils";
import * as songs from "./songs";
import { beginTutorial, tutorial } from "./tutorial";
import { Tween } from "./tween";
import {
  CircleVignette,
  createPauseMenu,
  createTitleMenu,
  pauseMenu,
  startBtn,
} from "./ui";
import { ScreenButton, toggleVisible } from "./uiUtils";
const { vec2, rgb, tile, time } = LJS;

export const DEBUG = false;

export const ratings = {
  superb: {
    message: `Superb!`,
    threshold: 0.8,
    color1: rgba(157, 28, 138, 1),
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
export let defaultSpeechBubblePos: LJS.Vector2;

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
  star_simple: [vec2(0, 1), 2],
  star_outline: [vec2(1, 1), 2],
  star: [vec2(2, 1), 2],
  check: [vec2(6, 0), 2],
  pause: [vec2(7, 0), 2],
  play: [vec2(8, 0), 2],
  github: [vec2(9, 0), 2],
  lock: [vec2(10, 0), 2],
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

export let vignette: CircleVignette;
export const font = "Averia Sans Libre";
export const tileSize = vec2(100);
export const angleDelta = 35 * DEG2RAD;
export let startCameraScale: number;
export let center: LJS.Vector2;
let leader: Microbe | undefined;

let matrixParticles: LJS.ParticleEmitter;
let musicVolume = 1;
let musicLoaded = false;
let percentLoaded = 0;
export let player: Player;
export let row: Microbe[] = [];

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

  toggleVisible(loadingText);
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

  // persistent blink animation
  row.forEach((m) =>
    new Tween((t) => t === 1 && m.wink(), 0, 1, 360).then(Tween.Loop)
  );

  return row;
}

export function clearRow() {
  row.forEach((m) => m.destroy());
  row.splice(0);
  leader = undefined;
}

export async function titleScreen(levels = false) {
  await (levels
    ? vignette.circleMask({ startRadius: LJS.mainCanvasSize.x, endRadius: 0 })
    : vignette.fade());

  setGameState(GameState.Title);
  startBtn.interactive = true;

  loadingText.visible = pauseMenu.visible = false;
  levelsMenu.visible = levels;
  levels && showLevels();
  titleText.visible = titleMenu.visible = !levels;

  setCurrentSong(songs.paarynasAllrite);

  row.forEach((m) => m.setCollision(false, false));
  for (let i = 0; i < 10; i++)
    currentSong.beat.at(beatCount({ bar: 8 + i * 4, beat: 1 }), () => {
      const m = new Microbe(polar(35 * DEG2RAD * (i + 1), 8), {
        song: currentSong,
        startSwim: true,
        wrapping: PatternWrapping.Loop,
      });
      m.setCollision(false, false);
      row.push(m);
    });

  startBtn.onClick = startGame;
  uiBopScale(startBtn, { delta: 0.1 });

  changeBackground();
  cameraZoom({ delta: 2 });

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

  currentSong.play({ loop: true });

  await (levels
    ? vignette.fadeOut()
    : vignette.circleMask({ endRadius: LJS.mainCanvasSize.x }));
}

function startGame() {
  if (!tutorialLevel.completed && beginTutorial) return tutorial();

  levelSelection();
}

function levelSelection() {
  levelsMenu.visible = true;
  showLevels();
  titleText.visible = titleMenu.visible = false;
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  new LJS.UISystemPlugin();
  // new LJS.PostProcessPlugin(tvShader);

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  let storedColor = localStorage.getItem(storeKey("player", "color"));
  playerColor = storedColor
    ? new LJS.Color().setHex(storedColor)
    : rgba(255, 85, 85, 1);

  startCameraScale = LJS.cameraScale;

  LJS.setTouchInputEnable(true);
  LJS.setSoundVolume(1);

  center = LJS.mainCanvasSize.scale(0.5);
  vignette = new CircleVignette();

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
  subtitle.shadowColor = titleText.shadowColor = setAlpha(
    rgba(15, 38, 95, 1),
    0.5
  );
  subtitle.shadowOffset = titleText.shadowOffset = vec2(0, 10);

  titleText.addChild(subtitle);
  // titleMenu.addChild(titleText);

  loadingText = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    LJS.mainCanvasSize,
    ""
  );

  loadingText.textColor = LJS.WHITE.copy();
  loadingText.textHeight = 42;

  defaultSpeechBubblePos = center.multiply(vec2(1, 0.3));

  loadAssets();
  initLevels();
  createPauseMenu();
  createTitleMenu();
  createLevelsMenu();

  toggleVisible(loadingText, pauseMenu, pauseBtn, titleMenu, levelsMenu);

  // DEBUG && titleScreen();
  // levelSM.start()
  // levelSM.end()
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
  ["frames.png", "frames_tummy.png", "objects.png", "caustic.png"]
);
