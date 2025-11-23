import * as LJS from "littlejsengine";
import { PatternWrapping, type TimingInfo } from "../beat";
import {
  currentSong,
  defaultMicrobeColor,
  playerColor,
  playerName,
  spriteAtlas
} from "../main";
import { rgba, setAlpha, type Maybe } from "../mathUtils";
import type { Song } from "../music";
import { MyParticle } from "../particleUtils";
import { sfx } from "../sfx";
import { Microbe, MicrobeAction, swimAccel } from "./microbe";

const { vec2, rgb } = LJS;

export const perfectThreshold = 0.75;
export const goodThreshold = 0.15;

export const firework = (
  pos: LJS.Vector2,
  { accuracy = 0, n = 5, color = undefined as Maybe<LJS.Color>, spin = 0 } = {}
) => {
  const lifeTime = 1;
  const r1 = 5;
  const r2 = 5;
  const size1 = 12.5;
  const size2 = LJS.lerp(20, 30, accuracy);
  const speed = LJS.lerp(0.5, 1, accuracy);
  const mkSizeFunc = (maxSize: number) => (t: number) =>
    Math.sin(t * Math.PI) * maxSize;
  const tileInfo = spriteAtlas.star;

  for (let i = 0, phi = 0; i < n; i++, phi += (Math.PI * 2) / n) {
    const colorStart = color ?? LJS.randColor().add(rgba(50, 50, 50, 1));

    // small ring
    new MyParticle(pos.add(vec2(1, 0).setAngle(phi, r1)), {
      tileInfo,
      lifeTime,
      colorStart,
      colorEnd: colorStart,
      velocity: vec2(1, 0).setAngle(phi, speed * 0.5),
      angleVelocity: speed * 0.1,
      spin,
      sizeFunc: mkSizeFunc(size1),
      additive: true,
      screenSpace: true,
    });

    // large ring
    new MyParticle(pos.add(vec2(1, 0).setAngle(phi, r2)), {
      tileInfo,
      lifeTime,
      colorStart,
      colorEnd: colorStart,
      velocity: vec2(1, 0).setAngle(phi, speed * 2),
      angleVelocity: speed * 0.1,
      spin,
      sizeFunc: mkSizeFunc(size2),
      additive: true,
      screenSpace: true,
      trailRate: 1 / 4,
    });
  }
};

const defaultPlayerName = "You";
export class Player extends Microbe {
  interactive = true;
  bumpSoundTimer: LJS.Timer;
  private readonly bumpSoundCooldown = 0.1;

  onClick?: (timing: TimingInfo) => void;

  // set color(color: LJS.Color) {
  //   this.color = color;
  //   localStorage.setItem(storeKey("player", "color"), color.toString());
  // }

  // set name(name: string) {
  //   this.name = name;
  //   localStorage.setItem(storeKey("player", "name"), name);
  // }

  constructor(
    pos: LJS.Vector2,
    {
      rowIdx = 0,
      leader = undefined as Maybe<Microbe>,
      song = undefined as Maybe<Song>,
      wrapping = PatternWrapping.End,
    } = {}
  ) {
    super(pos, {
      rowIdx,
      leader,
      song,
      wrapping,
    });

    this.name = playerName ?? defaultPlayerName;
    this.color = playerColor ?? defaultMicrobeColor;

    this.actions[MicrobeAction.Swim] = () => {};
    this.actions[MicrobeAction.Ding] = () => {
      this.idle();
      sfx.bell_g5.play(this.pos);
    };
    this.bumpSoundTimer = new LJS.Timer(this.bumpSoundCooldown);
  }

  bump(other: Microbe): void {
    super.bump(other);

    // if other's rowIdx is bigger, move to next phi
    // otherwise return to current phi

    if (this.bumpSoundTimer.elapsed()) {
      sfx.bloop.play(this.pos);
      this.bumpSoundTimer.set(this.bumpSoundCooldown);
    }

    this.applyForce(swimAccel.scale((other.phi > this.phi ? -1 : 1) * 0.2));
  }

  update(): void {
    const mouseInput = LJS.mouseWasPressed(0);
    const keybdInput = LJS.keyWasPressed("Space");

    if (this.interactive && (mouseInput || keybdInput)) {
      const info = currentSong.metronome.click();
      const { accuracy } = info;
      this.song!.scoreDelta = accuracy;

      this.onClick && this.onClick(info);

      this.swim();

      const pos =
        (mouseInput && LJS.mousePosScreen) ||
        LJS.worldToScreen(this.pos).add(vec2(0, 100));

      if (accuracy >= perfectThreshold)
        firework(pos, { accuracy, n: 10, spin: 0.05 });
      else if (accuracy >= goodThreshold)
        firework(pos, { accuracy, n: 8, color: LJS.YELLOW });
      else
        new MyParticle(pos, {
          tileInfo: spriteAtlas["hoop_click"],
          colorStart: LJS.RED,
          colorEnd: setAlpha(LJS.RED, 0),
          lifeTime: 1,
          sizeStart: 60,
          sizeEnd: 120,
          screenSpace: true,
        });
    }

    super.update();
  }

  render(): void {
    super.render();

    LJS.drawText(this.name, this.pos.add(vec2(0, 1.2)), 0.5);
  }
}
