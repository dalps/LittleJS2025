import * as LJS from "littlejsengine";
import {
  center,
  currentSong,
  defaultMicrobeColor,
  playerColor,
  playerName,
  setPlayerColor,
  setPlayerName,
  spriteAtlas,
  titleMenu,
  titleText,
  type AtlasKey,
} from "./main";
import { LOG, rgba, setAlpha, setHSLA, type Maybe } from "./mathUtils";
import { setVisible, UIInput, uitext as uiText } from "./uiUtils";
import { Tween } from "./tween";
import { uiShadow } from "./levels";
import { player } from "./entities/row";
const { vec2, rgb, hsl } = LJS;

export let colorPickerMenu: LJS.UIObject;
export let colorPickerBtn: LJS.UIObject;
export let startBtn: LJS.UIButton;
export let nameTextBox: UIInput;

export class IconButton extends LJS.UIButton {
  icon: LJS.UITile;

  constructor(
    btnPos: LJS.Vector2,
    iconKey: AtlasKey,
    {
      btnSize = vec2(50, 50),
      iconPos = vec2(),
      iconSize = vec2(40),
      iconColor = undefined as Maybe<LJS.Color>,
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
  startBtn = new LJS.UIButton(vec2(0, y), startBtnSize, "Play", LJS.CYAN);
  startBtn.hoverColor = LJS.WHITE;

  // startBtn.pos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.8));

  colorPickerBtn = new IconButton(vec2(100 + 60, y), "microbe_bw", {
    onClick: () => {
      colorPickerMenu.visible = true;
      setVisible(false, titleText, titleMenu);
      colorPickerBtn.lineColor = LJS.BLACK;
    },
    onEnter: () => {
      colorPickerBtn.lineColor = LJS.WHITE;
    },
    onLeave: () => {
      colorPickerBtn.lineColor = LJS.BLACK;
    },
  });

  colorPickerBtn.hoverColor =
    colorPickerBtn.color =
    colorPickerBtn.color =
      playerColor ?? defaultMicrobeColor;
  colorPickerBtn.cornerRadius = 10;

  let sourcecodeBtn = new IconButton(
    center.subtract(vec2(50)).multiply(vec2(1, -1)),
    "github",
    {
      onClick: () => {
        open(`https://github.com/dalps/LittleJS2025`, `_blank`);
      },
    }
  );

  // sourcecodeBtn.lineWidth = 3;
  sourcecodeBtn.cornerRadius = 10;
  sourcecodeBtn.lineColor = sourcecodeBtn.hoverColor = LJS.BLACK;
  sourcecodeBtn.hoverColor = sourcecodeBtn.color = rgba(235, 235, 235, 1);

  titleMenu.addChild(sourcecodeBtn);
  titleMenu.addChild(startBtn);
  titleMenu.addChild(colorPickerBtn);
}

function createColorPickerUI() {
  const btnSize = 50;
  const btnPadding = 5;

  colorPickerMenu = new LJS.UIObject(center);
  colorPickerMenu.visible = false;

  colorPickerMenu.color = player?.color || defaultMicrobeColor;
  colorPickerMenu.lineColor = LJS.BLACK;

  let backToTitleBtn = new IconButton(center.scale(-1).add(vec2(60)), "play", {
    btnSize: vec2(50),
    iconAngle: Math.PI,
    iconColor: LJS.BLACK,
    onClick: () => {
      colorPickerMenu.visible = false;
      titleText.visible = titleMenu.visible = true;
    },
  });

  colorPickerMenu.addChild(backToTitleBtn);

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

  const [titlePos, posTextBox, posColors] =
    LJS.mainCanvasSize.y > 500
      ? [vec2(0, -200), vec2(0, -80), vec2(0, 100)]
      : [vec2(0, -140), vec2(-200, 10), vec2(200, 50)];

  let title = new LJS.UIText(titlePos, vec2(1000, 50), "Wardrobe");
  let t2 = uiText("Customize your microbe's in-game look.", {
    pos: vec2(0, 50),
  });
  setShadow(title, uiShadow);
  setShadow(t2, uiShadow);

  colorPickerMenu.addChild(title);
  title.textColor = LJS.WHITE;
  title.addChild(t2);

  nameTextBox = new UIInput(posTextBox, {
    maxLength: 10,
    placeholder: "_",
    initialValue: playerName,
    onInput: setPlayerName,
  });
  const c = rgba(226, 226, 226, 1);
  nameTextBox.addChild(
    uiText("Enter microbe name", {
      pos: vec2(0, 50),
      textColor: c,
      shadow: uiShadow,
    })
  );
  colorPickerMenu.addChild(nameTextBox);

  const colorsObj = new LJS.UIObject(posColors);
  colorPickerMenu.addChild(colorsObj);

  colorsObj.addChild(
    uiText("Select tummy color", {
      pos: vec2(0, 100),
      textColor: c,
      shadow: uiShadow,
    })
  );

  let randomColorBtn = mkColorBtn(
    vec2(-btnSize - btnPadding, -btnSize - btnPadding * 2),
    undefined,
    "die"
  );

  colorsObj.addChild(randomColorBtn);

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
      let j = i === 0 ? 1 : 0, y = btnSize;
      j < 3;
      j++, y -= btnSize + btnPadding
    ) {
      colorsObj.addChild(
        mkColorBtn(vec2(x, y), colorOpts[i * 3 + (j - 1)]) // hsl((i * 3 + j) / 8, 0.75, 0.5)
      );
    }
  }
}

export let pauseMenu: LJS.UIObject;
export let quitBtn: LJS.UIButton;
export let restartBtn: LJS.UIButton;
export let resumeBtn: LJS.UIObject;

export function createPauseMenu() {
  pauseMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));

  const title = uiText("PAUSE", {
    pos: vec2(0, -100),
    fontSize: 50,
  });
  setShadow(title, uiShadow);

  const restartBtnColor = LJS.CYAN;
  const quitBtnColor = rgba(255, 56, 56, 1);

  // resumeBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Resume", LJS.GRAY);

  restartBtn = new LJS.UIButton(
    vec2(0, 80),
    vec2(200, 50),
    "Restart",
    restartBtnColor
  );
  restartBtn.hoverColor = LJS.WHITE;

  quitBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Quit", quitBtnColor);
  quitBtn.hoverColor = setHSLA(quitBtnColor, { l: 0.7 });

  pauseMenu.addChild(title);
  pauseMenu.addChild(quitBtn);
  // pauseMenu.addChild(resumeBtn);
  pauseMenu.addChild(restartBtn);
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

    window.addEventListener("resize", () => {
      const { innerWidth: w, innerHeight: h } = window;
      cvs.width = w;
      cvs.height = h;
      this.canvasSize.set(w, h);
    });
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

export interface UIShadowConfig {
  color?: LJS.Color;
  offset?: LJS.Vector2;
  blur?: number;
}

export const setShadow = (
  obj: LJS.UIObject,
  { color = LJS.BLACK, offset = vec2(10), blur = 5 }: UIShadowConfig = {}
) => {
  obj.shadowColor = color;
  obj.shadowOffset = offset;
  obj.shadowBlur = blur;
};
