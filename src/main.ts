"use strict";

// import LittleJS module
import * as LJS from "littlejsengine";
import { Microbe } from "./entities/microbe";
import { Player } from "./entities/player";
import { DEG2RAD, getQuadrant, LOG, polar, rgba } from "./mathUtils";
import type { Song } from "./music";
import * as songs from "./songs";
import { Ease, Tween } from "./tween";
import {
  colorPickerBtn,
  createPauseMenu,
  createStartMenu,
  pauseMenu,
  quitBtn,
  resumeBtn,
  startBtn,
} from "./ui";
import { sfx } from "./sfx";
const { vec2, rgb, tile, time } = LJS;

enum GameState {
  Loading,
  AwaitClick,
  Title,
  Game,
  Paused,
  GameResults,
}

export const ratings = {
  superb: {
    message: `Superb!`,
    threshold: 80,
    color1: rgba(203, 26, 138, 1),
    color2: rgba(243, 21, 209, 1),
  },
  ok: {
    message: `Just OK...`,
    threshold: 50,
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
export let titleSong: keyof typeof songs;

export const spriteAtlas: Record<string, LJS.TileInfo> = {};
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
let bubbles: {} = [];
let autoMicrobes: Microbe[] = [];

// ui
export let pauseBtn: LJS.UIObject;
export let titleObj: LJS.UIObject;
let loadingBtn: LJS.UIButton;
let foregroundCausticPos: LJS.Vector2 = vec2();
let backgroundCausticPos: LJS.Vector2 = vec2();

function loadAssets() {
  // init textures
  ["swim", "idle", "bump"].forEach((animKey, idx) => {
    spriteAtlas[animKey] = tile(vec2(0, idx), tileSize);

    spriteAtlas[`${animKey}_tummy`] = tile(vec2(0, idx), tileSize, 1);
  });

  spriteAtlas["bubble"] = tile(0, tileSize, 2);

  songs.initSongs();
  currentSong = titleSong = songs.paarynasAllrite!;

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

  loadingBtn = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    LJS.mainCanvasSize,
    "",
    rgba(0, 0, 0, 0)
  );
  loadingBtn.lineWidth = 0;
  loadingBtn.hoverColor = LJS.CLEAR_WHITE;
  loadingBtn.textColor = LJS.WHITE.copy();
  loadingBtn.textHeight = 42;
  center = LJS.mainCanvasSize.scale(0.5);
}

// After loading finishes, await the user's click. This is essential to play
// music in the title screen
function awaitClick() {
  gameState = GameState.AwaitClick;

  new Tween((t) => (loadingBtn.textColor.a = t), 1, 0.1, 10) //
    .then(() => {
      loadingBtn.text = "Click to start";
      new Tween((t) => (loadingBtn.textColor.a = t), 0, 1, 30) //
        .then(Tween.PingPong);
      // .setEase(
      //   Ease.PIECEWISE(
      //     () => 0,
      //     () => 1
      //   )
      // );
    });

  loadingBtn.interactive = true;

  loadingBtn.onClick = () => {
    loadingBtn.destroy();
    titleScreen();
  };
}

function makeRow({
  angleDelta = 35 * DEG2RAD,
  startAngle = 0,
  startDist = 5,
  playerIdx = -1,
  length = 3,
} = {}) {
  leader = new Microbe(vec2(0, startDist), undefined, 0, currentSong);
  autoMicrobes.push(leader);

  for (let i = 1; i < length; i++) {
    const startPos = polar(startAngle + angleDelta * -i, startDist);
    const m =
      i === playerIdx
        ? (player = new Player(startPos, leader, i, currentSong))
        : new Microbe(startPos, leader, i, currentSong);

    autoMicrobes.push(m);
  }
}

function clearRow() {
  autoMicrobes.forEach((m) => m.destroy());
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

  makeRow();

  // prettier-ignore
  matrixParticles = new LJS.ParticleEmitter(vec2(), 0, 100, 0, 10, 3.14, spriteAtlas["bubble"], new LJS.Color(1, 1, 1, 1), new LJS.Color(1, 1, 1, 1), new LJS.Color(0.439, 0.973, 0.361, 0), new LJS.Color(1, 1, 1, 0), 4.3, 0.2, 1, 0, 0, 1, 1, 0, 0, 0, 0, false, true, false, -1e4, false);

  autoMicrobes[1].addChild(matrixParticles);

  for (let i = 0; i < 100; i++) {
    const size = vec2(1).scale(LJS.rand(1, 5));
    const pos = LJS.randInCircle(100, 0);
    bubbles.push({ size, pos });
  }
}

function startGame() {
  currentSong.stop();

  currentSong = songs.stardustMemories!;
  currentSong.addMetronome();
  currentSong.onEnd = afterGame;
  currentSong.play();

  LOG(`Starting game...`);
  changeBackground();

  pauseBtn = new LJS.UIButton(
    LJS.mainCanvasSize.multiply(vec2(0.9, 0.1)),
    vec2(50, 50),
    "||"
  );

  pauseBtn.onClick = () => {
    gameState = GameState.Paused;

    pauseMenu.visible = true;
    pauseBtn.visible = false;
    changeBackground(LJS.BLACK);
    currentSong?.pause();
  };

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
    
    currentSong?.resume();
  };

  clearRow();
  makeRow({ playerIdx: 1 });

  currentSong = songs.stardustMemories!;
  currentSong.addMetronome();
  player.color = colorPickerBtn.color;

  titleObj.visible = false;

  gameState = GameState.Game;
}

function afterGame() {
  gameState = GameState.GameResults;

  let finalScore = currentSong.getFinalScore();

  let resultsObj = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  let title = new LJS.UIText(vec2(0, -100), vec2(1000, 60), `Rhythm Check:`);
  let scoreText = new LJS.UIText(vec2(), vec2(200, 60), `0`);
  let ratingText = new LJS.UIText(vec2(100), vec2(200, 48), ``);
  let backToTitleBtn = new LJS.UIButton(
    vec2(0, 200),
    LJS.mainCanvasSize,
    "Back to title",
    rgba(0, 0, 0, 0)
  );

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
  scoreText.textColor = ratingText.textColor = title.textColor = LJS.WHITE;

  // const between = (value: number, a: number, b: number) =>
  //   a < value && value <= b;

  changeBackground(LJS.BLACK);

  // tally up the score
  new Tween(
    (t) => {
      // play beep sound with pitch function of t
      scoreText.text = `${(t * 100) >> 0}%`;
    },
    0,
    finalScore,
    100
  ).then(() => {
    // show rating
    const { message, color1, color2 } = Object.values(ratings).find(
      ({ threshold }) => threshold <= finalScore
    )!;

    ratingText.visible = true;
    ratingText.text = message;
    ratingText.textColor = color1;
    ratingText.textLineColor = color2;

    new Tween((t) => (backToTitleBtn.textColor.a = t), 0, 1, 30) //
      .then(Tween.PingPong);
  });
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
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  switch (gameState) {
    case GameState.Loading:
      if (currentSong?.sound?.isLoaded()) awaitClick();
      break;
    case GameState.Title:
      LJS.setCameraPos(LJS.cameraPos.add(LJS.keyDirection()));
      // LJS.setCameraPos(autoMicrobes[1].pos);
      break;
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
      loadingBtn.text = `Loading music: ${loadedPercent}%`;
      break;

    case GameState.Game:
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
