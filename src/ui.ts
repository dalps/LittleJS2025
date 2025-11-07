import * as LJS from "littlejsengine";
import { font, spriteAtlas, titleObj, type AtlasKey } from "./main";
const { vec2, rgb, hsl } = LJS;

export let colorPickerMenu: LJS.UIObject;
export let colorPickerBtn: LJS.UIObject;
export let playerColor: LJS.Color;
export let startBtn: LJS.UIButton;

export class IconButton extends LJS.UIButton {
  constructor(
    btnPos: LJS.Vector2,
    iconKey: AtlasKey,
    {
      btnSize = vec2(50, 50),
      iconPos = vec2(),
      iconSize = vec2(40),
      onClick = () => {},
      onEnter = () => {},
      onLeave = () => {},
    } = {}
  ) {
    super(btnPos, btnSize);

    let icon = new LJS.UITile(iconPos, iconSize, spriteAtlas[iconKey]);
    this.addChild(icon);

    icon.interactive = true;
    this.onClick = icon.onClick = onClick.bind(this);
    this.onEnter = icon.onEnter = onEnter.bind(this);
    this.onLeave = icon.onLeave = onLeave.bind(this);
  }
}

export function createStartMenu() {
  createColorPickerUI();

  const y = 150;
  startBtn = new LJS.UIButton(vec2(0, y), vec2(200, 50), "Start", LJS.CYAN);

  // startBtn.pos = LJS.mainCanvasSize.multiply(vec2(0.5, 0.8));

  colorPickerBtn = new IconButton(vec2(100 + 60, y), "microbe_bw", {
    onClick: () => {
      colorPickerMenu.visible = true;
      titleObj.visible = false;
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

  titleObj.addChild(startBtn);
  titleObj.addChild(colorPickerBtn);
}

function createColorPickerUI() {
  const btnSize = 50;
  const btnPadding = 5;

  colorPickerMenu = new LJS.UIObject(LJS.mainCanvasSize.scale(0.5));
  colorPickerMenu.visible = false;

  colorPickerMenu.color = LJS.GRAY;
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
      colorPickerBtn.hoverColor =
        colorPickerBtn.color =
        playerColor =
          color ?? LJS.randColor();
      colorPickerMenu.visible = false;
      titleObj.visible = true;
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

  const text = new LJS.UIText(vec2(0, -100), vec2(1000, 50), "PAUSE");

  text.textColor = LJS.WHITE;

  resumeBtn = new LJS.UIButton(vec2(0, 150), vec2(200, 50), "Resume", LJS.GRAY);
  quitBtn = new LJS.UIButton(vec2(0, 215), vec2(200, 50), "Quit", LJS.RED);

  pauseMenu.addChild(text);
  pauseMenu.addChild(quitBtn);
  pauseMenu.addChild(resumeBtn);
}
