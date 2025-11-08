"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import { DEG2RAD, getQuadrant, LOG, polar, rgba, setAlpha } from "./mathUtils";
import type { Song } from "./music";
import { emitter, MyParticle } from "./particleUtils";
import * as songs from "./songs";
import { Ease, Tween } from "./tween";
import {
  colorPickerBtn,
  createPauseMenu,
  createStartMenu,
  IconButton,
  pauseMenu,
  quitBtn,
  resumeBtn,
  startBtn,
} from "./ui";
import { PatternWrapping } from "./beat";
import { sfx } from "./sfx";
import { pulse, sleep } from "./animUtils";
import { hasDoneTutorial, tutorial } from "./tutorial";
import { ScreenButton } from "./uiUtils";
const { vec2, rgb, tile, time } = LJS;

enum GameState {
  Loading,
  AwaitClick,
  Title,
  Game,
  Tutorial,
  Paused,
  GameResults,
}

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

export let gameState: GameState = GameState.Loading;
export let currentSong: Song;

export function setCurrentSong(song: Song) {
  currentSong?.stop();
  currentSong = song;
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
  pause: [vec2(7, 0), 2],
  play: [vec2(8, 0), 2],
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
export let pauseBtn: LJS.UIObject;
export let titleObj: LJS.UIObject;
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
  currentSong = songs.paarynasAllrite!;

  titleObj = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  let titleText = new LJS.UIText(
    vec2(0, -100),
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
  titleObj.addChild(titleText);

  loadingText = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    LJS.mainCanvasSize,
    ""
  );
  loadingText.textColor = LJS.WHITE.copy();
  loadingText.textHeight = 42;

  center = LJS.mainCanvasSize.scale(0.5);
}

/**
 * Called after loading completes to await the user's click, which is necessary to wake up the AudioContext.
 */
function awaitClick() {
  gameState = GameState.AwaitClick;

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
  leader = new Microbe(vec2(0, startDist), undefined, 0, currentSong, wrapping);
  row.push(leader);

  for (let i = 1; i < length; i++) {
    const startPos = polar(startAngle + angleDelta * -i, startDist);

    const m =
      i === playerIdx
        ? (player = new Player(startPos, leader, i, currentSong))
        : new Microbe(startPos, leader, i, currentSong, wrapping);

    row.push(m);
  }

  return row;
}

export function clearRow() {
  row.forEach((m) => m.destroy());
  row.splice(0);
  leader = undefined;
}

function changeBackground(color = currentSong.color) {
  new Tween(
    (t) => LJS.setCanvasClearColor(LJS.canvasClearColor.lerp(color, t)),
    0,
    1,
    20
  ).setEase(Ease.OUT(Ease.BOUNCE));
}

function titleScreen() {
  gameState = GameState.Title;

  clearRow();

  pauseMenu.visible = false;
  titleObj.visible = true;

  createStartMenu();

  startBtn.onClick = startGame;

  currentSong = songs.paarynasAllrite!;

  changeBackground();
  currentSong?.play();

  LJS.setTouchInputEnable(true);
  LJS.setSoundVolume(1);

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
  if (!hasDoneTutorial) {
    clearRow();
    titleObj.destroy();
    gameState = GameState.Tutorial;
    return tutorial();
  }

  setCurrentSong(songs.stardustMemories);

  currentSong.addMetronome();
  currentSong.onEnd = afterGame;
  currentSong.play();

  // LOG(`Starting game...`);
  changeBackground();

  pauseBtn = new IconButton(
    LJS.mainCanvasSize.multiply(vec2(0.9, 0.1)),
    "pause",
    {
      btnSize: vec2(50),
      iconSize: vec2(30),
      iconColor: LJS.BLACK,
      onClick: () => {
        gameState = GameState.Paused;

        pauseMenu.visible = true;
        pauseBtn.visible = false;

        changeBackground(LJS.BLACK);
        cameraZoom({ delta: -2, duration: 100 });

        currentSong?.pause();
      },
    }
  );

  quitBtn.onClick = () => {
    clearRow();
    player.destroy();
    currentSong?.stop();
    currentSong = songs[titleSong];
    titleScreen();
  };

  resumeBtn.onClick = () => {
    gameState = GameState.Game;

    pauseMenu.visible = false;
    pauseBtn.visible = true;

    changeBackground();
    cameraZoom({ delta: 2 });

    currentSong?.resume();
  };

  clearRow();
  makeRow({ playerIdx: 1 });
  // afterGame();

  currentSong = songs.stardustMemories!;
  currentSong.addMetronome();
  player.color = colorPickerBtn.color;

  titleObj.visible = false;

  gameState = GameState.Game;
}

export function cameraZoom({
  delta = 1,
  ease = Ease.OUT(Ease.POWER(3)),
  duration = 10,
} = {}) {
  new Tween(
    (v) => LJS.setCameraScale(v),
    LJS.cameraScale,
    LJS.cameraScale + delta,
    duration
  ).setEase(ease);
}

function afterGame() {
  gameState = GameState.GameResults;

  currentSong.hide();
  let finalScore = currentSong.getFinalScore();
  LOG(`finalScore: ${finalScore}`);

  let resultsObj = new LJS.UIObject(
    LJS.mainCanvasSize.scale(0.5),
    vec2(580, 300)
  );
  let title = new LJS.UIText(vec2(0, -100), vec2(1000, 60), `Rhythm score:`);

  title.textColor = rgba(217, 217, 217, 1);

  let scoreText = new LJS.UIText(vec2(), vec2(200, 72), `0%`);
  let ratingText = new LJS.UIText(vec2(100), vec2(200, 48), ``);
  let backToTitleBtn = new LJS.UIButton(
    vec2(0, 250),
    LJS.mainCanvasSize,
    "Back to title",
    rgba(0, 0, 0, 0)
  );

  resultsObj.color = setAlpha(LJS.BLACK, 0.5);
  resultsObj.cornerRadius = 50;
  resultsObj.lineColor = LJS.YELLOW;
  resultsObj.lineWidth = 10;
  resultsObj.shadowOffset = vec2(20);
  resultsObj.shadowBlur = 10;
  resultsObj.shadowColor = setAlpha(LJS.BLACK, 0.5);

  backToTitleBtn.visible = false;

  backToTitleBtn.onClick = () => {
    resultsObj.destroy();
    currentSong.stop();
    titleScreen();
  };
  backToTitleBtn.lineWidth = 0;
  backToTitleBtn.hoverColor = LJS.CLEAR_WHITE;
  backToTitleBtn.textColor = LJS.WHITE.copy();
  backToTitleBtn.textHeight = 42;

  pauseBtn.visible = false;

  resultsObj.addChild(backToTitleBtn);
  resultsObj.addChild(title);
  resultsObj.addChild(scoreText);
  resultsObj.addChild(ratingText);

  ratingText.visible = false;
  ratingText.textLineWidth = 5;
  scoreText.textColor = ratingText.textColor = LJS.WHITE;

  // const between = (value: number, a: number, b: number) =>
  //   a < value && value <= b;

  changeBackground(LJS.BLACK);
  currentSong.metronome.hide();

  sfx.blink.play(undefined, 1);

  // const scoreTimerDelta = 1 / LJS.lerp(3, 10, finalScore);
  // let scoreTimer = new LJS.Timer(scoreTimerDelta);

  let prevT = 0;

  // tally up the score
  sleep(100).then(() =>
    new Tween(
      (t) => {
        // play beep sound with pitch function of t
        let intT = (t * 100) >> 0;
        if (intT > prevT) {
          sfx.blink.play(undefined, 0.5, LJS.clamp(1 + t, 0, 2));
          scoreText.text = `${intT}%`;
          prevT = intT;
        }
      },
      0,
      finalScore,
      LJS.lerp(100, 250, finalScore) >> 0
    ).then(() => {
      sleep(100).then(() => {
        // show rating
        sfx.blink.play(undefined, 1, LJS.clamp(1 + finalScore, 0, 2));

        const { message, color1, color2 } = Object.values(ratings).find(
          ({ threshold }) => threshold <= finalScore
        )!;

        ratingText.visible = true;
        ratingText.text = message;
        ratingText.textColor = color1;
        ratingText.textLineColor = color2;

        sleep(100).then(() => {
          backToTitleBtn.visible = true;
          pulse(backToTitleBtn.textColor);
        });
      });
    })
  );
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  new LJS.UISystemPlugin();
  // new LJS.PostProcessPlugin(tvShader);

  LJS.setFontDefault(font);
  LJS.uiSystem.defaultFont = font;

  createPauseMenu();
  pauseMenu.visible = false;

  loadAssets();
  // titleScreen();
  // tutorial();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      if (currentSong?.sound?.isLoaded()) awaitClick();
      break;
    case GameState.Title:
      // LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
      LJS.setCameraPos(row[1].pos);
      break;
    case GameState.Tutorial:
    case GameState.Game:
      // LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
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
