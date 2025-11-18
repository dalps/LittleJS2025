import * as LJS from "littlejsengine";
import { blink, sleep } from "./animUtils";
import { center, spriteAtlas } from "./main";
import { DEG2RAD, LOG, rgba, setAlpha, setHSLA } from "./mathUtils";
import { sfx } from "./sfx";
import { setShadow, type UIShadowConfig } from "./ui";
const { vec2, rgb, tile } = LJS;

export const toggleVisible = (...objs: LJS.UIObject[]) =>
  objs.forEach((o) => (o.visible = !o.visible));

export const setVisible = (value: boolean, ...objs: LJS.UIObject[]) =>
  objs.forEach((o) => (o.visible = value));

export const speech = (pos: LJS.Vector2, text: string) =>
  new SpeechBubble(pos, text);

const minBubbleWidth = 180;

export class SpeechBubble extends LJS.UIText {
  then: (f?: (...args: any[]) => any) => this;

  constructor(
    pos: LJS.Vector2,
    text: string,
    {
      duration = 3,
      size = vec2(200, 50),
      align = "center" as CanvasTextAlign,
      padding = 20,
      clickMode = true,
    } = {}
  ) {
    super(pos, size, text, align);

    const lines = text.split(`\n`);
    const longestLineLength = Math.max(...lines.map((l) => l.length));

    const arrowWidth = 15;
    this.color = LJS.WHITE;
    this.lineWidth = 3;
    this.lineColor = LJS.BLACK;
    this.cornerRadius = this.size.y * 0.25;
    this.textColor = LJS.BLACK;
    this.textHeight = 24;
    this.size = vec2(
      LJS.max(
        minBubbleWidth,
        longestLineLength * (this.textHeight / 2) + arrowWidth
      ),
      this.textHeight * lines.length
    ).add(vec2(padding));
    this.interactive = false;
    this.hoverColor = this.color;
    this.activeColor = this.lineColor;
    this.canBeHover = true;
    this.then = (f) => ((this.then = f!), this);

    clickMode && sfx.blink.play();

    sleep(duration).then(
      clickMode
        ? () => {
            const arrowSize = vec2(arrowWidth);
            const nextBtn = new LJS.UITile(
              this.pos.add(this.size.scale(0.5).subtract(arrowSize)),
              arrowSize,
              spriteAtlas.play,
              LJS.BLACK
            );
            blink(nextBtn.color, 20);
            new ScreenButton(() => {
              nextBtn.destroy();
              this.destroy();
              this.then();
            });

            // nextBtn.interactive = this.interactive = true;
          }
        : () => this.destroy()
    );
  }

  render(): void {
    super.render();

    // arrow pointing down
    LJS.drawTile(
      this.pos.add(this.size.multiply(vec2(0, 0.5))),
      vec2(50, 25),
      spriteAtlas.play,
      LJS.BLACK,
      90 * DEG2RAD,
      undefined,
      undefined,
      undefined,
      true
    );
  }
}

export class ScreenButton extends LJS.UIButton {
  constructor(onClick: Function) {
    super(LJS.mainCanvasSize.scale(0.5), LJS.mainCanvasSize);

    this.color =
      this.lineColor =
      this.hoverColor =
      this.activeColor =
        LJS.CLEAR_WHITE;

    // this.hoverColor = setAlpha(LJS.WHITE, 0.5);

    this.onClick = () => {
      onClick();
      this.destroy();
    };
  }
}

export const uitext = (
  text: string,
  {
    pos = center,
    fontSize = 20,
    fontStyle = "",
    textColor = LJS.WHITE,
    align = "center" as CanvasTextAlign,
    shadow = undefined as UIShadowConfig | undefined,
  } = {}
) => {
  let t = new LJS.UIText(pos, vec2(1000, fontSize), text, align);
  t.textColor = textColor;
  t.fontStyle = fontStyle;
  t.hoverColor = t.color = LJS.CLEAR_WHITE;
  shadow && setShadow(t, shadow);
  return t;
};

export function setInteractiveRec(obj: LJS.UIObject, value = false) {
  obj.interactive = value;
  obj.children.forEach((o) => setInteractiveRec(o, value));
}

export class UIInput extends LJS.UIText {
  blinker: LJS.UIText;
  maxLength: number;
  value?: string;

  constructor(
    pos: LJS.Vector2,
    { textHeight = 40, placeholder = "_", maxLength = 16 } = {}
  ) {
    super(pos, vec2(maxLength * textHeight * 0.5 + textHeight, textHeight + 10));

    this.maxLength = maxLength;
    this.blinker = new LJS.UIText(
      vec2(), // this.size.multiply(vec2(0, -0.1)),
      vec2(this.size.y),
      placeholder
      // "left"
    );
    this.addChild(this.blinker);

    blink(this.blinker.textColor);

    this.interactive =
      this.blinker.interactive =
      this.canBeHover =
      this.blinker.canBeHover =
        true;

    this.fontStyle = this.blinker.fontStyle = "italic";
    this.textHeight = this.blinker.textHeight = 32;
    this.blinker.hoverColor = LJS.CLEAR_WHITE;
    this.lineWidth = 5;
    this.lineColor = LJS.BLACK;
    this.cornerRadius = 5;
    this.color = rgba(233, 233, 233, 1);
    this.hoverColor = rgba(215, 215, 215, 1);

    this.onClick = this.blinker.onClick = () => {
      let input = prompt();
      if (!input) return;
      this.blinker.visible = false;
      this.value = this.text = input.slice(0, maxLength);
    };
  }
}
