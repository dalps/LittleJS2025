import * as LJS from "littlejsengine";
import {
  center,
  currentSong,
  playerColor,
  setPlayerColor,
  spriteAtlas,
  titleMenu,
  titleText,
  type AtlasKey,
} from "./main";
import { LOG, rgba, setAlpha } from "./mathUtils";
import { uitext as uiText } from "./uiUtils";
import { Tween } from "./tween";
const { vec2, rgb, hsl } = LJS;

export let colorPickerMenu: LJS.UIObject;
export let colorPickerBtn: LJS.UIObject;
export let startBtn: LJS.UIButton;

export class IconButton extends LJS.UIButton {
  icon: LJS.UITile;

  constructor(
    btnPos: LJS.Vector2,
    iconKey: AtlasKey,
    {
      btnSize = vec2(50, 50),
      iconPos = vec2(),
      iconSize = vec2(40),
      iconColor = undefined as LJS.Color | undefined,
      iconAngle = 0,
      onClick = () => {},
      onEnter = () => {},
      onLeave = () => {},
    } = {}
  ) {
    super(btnPos, btnSize);

    this.icon = new LJS.UITile(
      iconPos,
      iconSize,
      spriteAtlas[iconKey],
      iconColor,
      iconAngle
    );
    this.addChild(this.icon);

    this.icon.interactive = this.icon.canBeHover = true;

    // TODO: use a Proxy to set both UIObjects's listeners
    this.onClick = this.icon.onClick = onClick.bind(this);
    this.onEnter = this.icon.onEnter = onEnter.bind(this);
    this.onLeave = this.icon.onLeave = onLeave.bind(this);
  }
}

export function createTitleMenu() {
  createColorPickerUI();

  const y = 150;
  const startBtnSize = vec2(200, 50);
  startBtn = new LJS.UIButton(vec2(0, y), startBtnSize, "Start", LJS.CYAN);
  startBtn.hoverColor = LJS.WHITE;

  // startBtn.pos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.8));

  colorPickerBtn = new IconButton(vec2(100 + 60, y), "microbe_bw", {
    onClick: () => {
      colorPickerMenu.visible = true;
      titleText.visible = titleMenu.visible = false;
      colorPickerBtn.lineColor = LJS.BLACK;
    },
    onEnter: () => {
      colorPickerBtn.lineColor = LJS.WHITE;
    },
    onLeave: () => {
      colorPickerBtn.lineColor = LJS.BLACK;
    },
  });

  colorPickerBtn.hoverColor = colorPickerBtn.color = playerColor;
  colorPickerBtn.cornerRadius = 10;

  let credits = new LJS.UIText(
    center.multiply(vec2(0, 1.1)),
    vec2(100, 15),
    `dalps 2025`
  );

  let onClick = () => {
    open(`https://github.com/dalps/LittleJS2025`, `_blank`);
  };
  let sourcecodeBtn = new IconButton(
    center.subtract(vec2(50)).multiply(vec2(1, -1)),
    "github",
    {
      onClick,
    }
  );
  // sourcecodeBtn.lineWidth = 3;
  sourcecodeBtn.cornerRadius = 10;
  sourcecodeBtn.lineColor = sourcecodeBtn.hoverColor = LJS.BLACK;

  // credits.addChild(sourcecodeBtn);

  sourcecodeBtn.hoverColor =
    sourcecodeBtn.color =
    credits.textColor =
      rgba(235, 235, 235, 1);

  credits.hoverColor = LJS.CLEAR_WHITE;

  credits.interactive = credits.canBeHover = true;

  credits.onClick = onClick;
  titleMenu.addChild(credits);
  titleMenu.addChild(sourcecodeBtn);
  titleMenu.addChild(startBtn);
  titleMenu.addChild(colorPickerBtn);
}

function createColorPickerUI() {
  const btnSize = 50;
  const btnPadding = 5;

  colorPickerMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  colorPickerMenu.visible = false;

  colorPickerMenu.color = playerColor;
  colorPickerMenu.lineColor = LJS.BLACK;

  let mkColorBtn = (
    pos: LJS.Vector2,
    color?: LJS.Color,
    iconKey?: AtlasKey
  ) => {
    let btn = new LJS.UIButton(pos, vec2(btnSize));
    let icon: LJS.UITile;

    btn.color = color ?? LJS.WHITE;
    btn.textColor = LJS.BLACK;
    btn.interactive = true;
    btn.cornerRadius = 10;
    btn.activeColor = color;
    btn.hoverColor = color ?? LJS.WHITE;

    const onEnter = () => {
      btn.lineColor = LJS.WHITE;
    };
    const onLeave = () => {
      btn.lineColor = LJS.BLACK;
    };

    const onClick = () => {
      colorPickerBtn.hoverColor = colorPickerBtn.color =
        color ?? LJS.randColor();
      setPlayerColor(colorPickerBtn.color);
      colorPickerMenu.visible = false;
      titleText.visible = titleMenu.visible = true;
      btn.lineColor = LJS.BLACK;
    };

    btn.onClick = onClick;
    btn.onEnter = onEnter;
    btn.onLeave = onLeave;

    if (iconKey) {
      icon = new LJS.UITile(vec2(), vec2(40), spriteAtlas[iconKey]);
      icon.interactive = true;
      icon.onClick = onClick;
      icon.onEnter = onEnter;
      icon.onLeave = onLeave;
      btn.addChild(icon);
    }

    return btn;
  };

  let cue = new LJS.UIText(vec2(0, -100), vec2(1000, 50), "Character color");
  cue.textColor = LJS.WHITE;

  let randomColorBtn = mkColorBtn(
    vec2(-btnSize - btnPadding, 50 + -btnSize - btnPadding * 2),
    undefined,
    "die"
  );

  colorPickerMenu.addChild(cue);
  colorPickerMenu.addChild(randomColorBtn);

  const colorOpts = [
    LJS.GREEN,
    LJS.RED,
    LJS.YELLOW,
    LJS.BLUE,
    LJS.MAGENTA,
    LJS.CYAN,
    LJS.GRAY,
    LJS.PURPLE,
  ].map((c) => {
    let [h, s, _] = c.HSLA();
    return c.copy().setHSLA(h, s * 0.75, 0.5);
  });

  for (
    let i = 0, x = -btnSize - btnPadding;
    i < 3;
    i++, x += btnSize + btnPadding
  ) {
    for (
      let j = i === 0 ? 1 : 0, y = 50 + btnSize;
      j < 3;
      j++, y -= btnSize + btnPadding
    ) {
      colorPickerMenu.addChild(
        mkColorBtn(vec2(x, y), colorOpts[i * 3 + (j - 1)]) // hsl((i * 3 + j) / 8, 0.75, 0.5)
      );
    }
  }
}

export let pauseMenu: LJS.UIObject;
export let quitBtn: LJS.UIObject;
export let resumeBtn: LJS.UIObject;

export function createPauseMenu() {
  pauseMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));

  const title = uiText("PAUSE", {
    pos: vec2(0, -100),
    fontSize: 50,
  });

  // resumeBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Resume", LJS.GRAY);
  quitBtn = new LJS.UIButton(
    vec2(0, 150),
    vec2(200, 50),
    "Quit",
    rgba(255, 56, 56, 1)
  );
  quitBtn.hoverColor = rgba(255, 128, 128, 1);

  quitBtn.addChild(
    uiText(`(no resume for now, sorry!)`, {
      pos: vec2(0, -60),
      fontSize: 20,
    })
  );
  pauseMenu.addChild(title);
  pauseMenu.addChild(quitBtn);
  // pauseMenu.addChild(resumeBtn);
}

const defaultFadeDuration = 30;

export class CircleVignette {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  canvasSize: LJS.Vector2;
  radius = 0;

  constructor() {
    this.canvasSize = LJS.mainCanvasSize.copy();
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;

    const { canvas: cvs } = this;
    cvs.width = this.canvasSize.x;
    cvs.height = this.canvasSize.y;
    cvs.style =
      "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); image-rendering: pixelated;";

    document.body.appendChild(cvs);
  }

  fade({
    start = 0,
    end = 1,
    duration = defaultFadeDuration,
    color = LJS.BLACK,
  } = {}) {
    const { ctx: ctx, canvasSize } = this;
    return new Tween(
      (t) => {
        // there must be a better way of flooding the canvas
        ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
        ctx.fillStyle = setAlpha(color, t);
        ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
      },
      start,
      end,
      duration
    );
  }

  fadeOut = ({ duration = defaultFadeDuration } = {}) =>
    this.fade({ start: 1, end: 0, duration });

  circleMask({ startRadius = 0, endRadius = 100, duration = 100 } = {}) {
    const { ctx, canvasSize } = this;
    return new Tween(
      (t) => {
        ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);

        ctx.beginPath();
        ctx.rect(0, 0, canvasSize.x, canvasSize.y);
        ctx.ellipse(
          canvasSize.x * 0.5,
          canvasSize.y * 0.5,
          t,
          t,
          0,
          0,
          Math.PI * 2,
          true // counterclockwise
        );

        // ctx.clip(clipPath);

        ctx.fillStyle = LJS.BLACK;
        ctx.fill();
      },
      startRadius,
      endRadius,
      duration
    );
  }
}

export class UIProgressbar extends LJS.UIObject {
  value = 0;
  barColor: LJS.Color;

  constructor(
    pos: LJS.Vector2,
    size: LJS.Vector2,
    startValue = 0,
    barColor = LJS.YELLOW
  ) {
    super(pos, size);
    this.value = startValue;
    this.barColor = barColor;
  }

  render(): void {
    super.render();

    const barWidth = LJS.max(
      this.cornerRadius * 2,
      LJS.lerp(0, this.size.x, this.value)
    );
    const barPos = this.pos.copy();

    barPos.x -= this.size.x * 0.5 - barWidth * 0.5;

    LJS.uiSystem.drawRect(
      barPos,
      vec2(barWidth, this.size.y),
      this.barColor,
      this.lineWidth,
      this.lineColor,
      this.cornerRadius,
      this.gradientColor
    );
  }
}
