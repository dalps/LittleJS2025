import { engineAddPlugin, LOG } from "littlejsengine";

type n = number;
type t = number;
type f = (x: n) => any;

/**
 * Tween & Ease utilities by [EthanSuperior](https://github.com/EthanSuperior).
 *
 * Original code is pure JS, I guessed most of the TypeScript signatures to make the TS compiler happy.
 *
 * [source](https://github.com/KilledByAPixel/LittleJS/issues/112)
 */
export class Tween {
  static active: Tween[] = [];
  id: string;
  life: t;
  delta: number;
  fn: (x: t) => any;
  then: (f?: (...args: any[]) => any) => this;
  setEase: (f: f) => this;
  ease = (t: number) => t;

  static {
    engineAddPlugin(this.update);
  }

  constructor(
    /**
     * What to do as the tween runs
     */
    fn: (t: number) => any,

    /**
     * Value at start
     */
    public start = 0,

    /**
     * Value at end
     */
    public end = 1,

    /**
     * Duration of the tween. MUST BE INTEGER!
    */
   public duration = 100
  ) {
    // Properties for the Tween to function
    this.id = crypto.randomUUID();
    this.life = this.duration >> 0;
    this.delta = this.end - this.start;
    this.fn = fn;
    // Callback for when Tween is completed
    this.then = (f) => ((this.then = f!), this);
    this.setEase = (f) => ((this.ease = f), this);
    Tween.active.push(this);
    this.fn(this.interp(this.duration));
  }

  interp(life: t) {
    const y = this.ease((this.duration - life) / this.duration);
    return y * this.delta + this.start;
  }

  cancel() {
    LOG(`cancelling tween with id ${this.id}`);
    Tween.cancel(this.id);
  }

  static cancel(handle: string) {
    let idx = Tween.active.findIndex((t) => t.id === handle);
    LOG(`cancelling tween with idx ${idx}`);
    idx >= 0 && Tween.active.splice(idx, 1);
  }

  static update() {
    // for(let t,i=0;i<Tween.living.length;i++)
    // 	--(t=Tween.living[i]).life?t.fn(t.curr):(t.fn(t.end),Tween.living.splice(i--,1),t.then());
    for (let i = 0; i < Tween.active.length; i++) {
      const twn = Tween.active[i];
      if (--twn.life) twn.fn(twn.interp(twn.life));
      else {
        twn.fn(twn.interp(0));
        Tween.active.splice(i--, 1);
        twn.then();
      }
    }
  }

  static Loop = function (this: any, n: number) {
    function repeat(this: any) {
      new Tween(this.fn, this.start, this.end, this.duration)
        .setEase(this.ease)
        .then(Tween.Loop(n));
    }
    if (--n == 0) return () => {};
    else if (n) return repeat;
    else Tween.Loop(Infinity)?.call(this);
  };

  static PingPong = function (this: any, n: number) {
    function repeat(this: any) {
      new Tween(this.fn, this.end, this.start, this.duration)
        .setEase(this.ease)
        .then(Tween.PingPong(n));
    }
    if (--n == 0) return () => {};
    else if (n) return repeat;
    else Tween.PingPong(Infinity)?.call(this);
  };
}

export class Ease {
  static LINEAR: f = (x) => x;
  static POWER: (n: n) => f = (n: n) => (x) => x ** n;
  static SINE: f = (x) => 1 - Math.cos(x * (Math.PI / 2));
  static CIRC: f = (x) => 1 - Math.sqrt(1 - x * x);
  static EXPO: f = (x) => 2 ** (10 * x - 10);
  static BACK: f = (x) => x * x * (2.70158 * x - 1.70158);
  static ELASTIC: f = (x) =>
    -(2 ** (10 * x - 10)) * Math.sin(((37 - 40 * x) * Math.PI) / 6);

  static SPRING: f = (x) =>
    1 -
    (Math.sin(Math.PI * (1 - x) * (0.2 + 2.5 * (1 - x) ** 3)) *
      Math.pow(x, 2.2) +
      (1 - x)) *
      (1.0 + 1.2 * x);

  static BOUNCE: f = (x) => {
    const bounceOut: f = (x) => {
      if (x < 4 / 11) return 7.5625 * x * x;
      if (x < 8 / 11) return bounceOut(x - 6 / 11) + 0.75;
      if (x < 10 / 11) return bounceOut(x - 9 / 11) + 0.9375;
      return bounceOut(x - 10.5 / 11) + 0.984375;
    };
    return Ease.OUT(bounceOut)(x);
  };

  static BEZIER = (x1: n, y1: n, x2: n, y2: n) => {
    const curve = (t: n) => {
      const u = 1 - t;
      const c1 = 3 * u * u * t;
      const c2 = 3 * u * t * t;
      const t3 = t ** 3;
      return [c1 * x1 + c2 * x2 + t3, c1 * y1 + c2 * y2 + t3];
    };

    return (x: n) => {
      let t0 = 0,
        t1 = 1;

      for (let i = 0; i < 128; i++) {
        const tMid = (t0 + t1) / 2;
        const [bx, by] = curve(tMid);
        if (Math.abs(bx - x) < 1e-5) return by;
        else if (bx < x) t0 = tMid;
        else t1 = tMid;
      }
      return curve((t0 + t1) / 2)[1];
    };
  };

  static IN = (x: n) => x;

  static OUT = (f: { (x: n): n; (arg0: n): n }) => (x: n) => 1 - f(1 - x);

  static IN_OUT = (f: f) => this.PIECEWISE(f, Ease.OUT(f));

  static PIECEWISE = (...fns: f[]) => {
    const n = fns.length;
    return (x: n) => {
      let i = (x * n - 1e-9) >> 0;
      return (fns[i]((x - i / n) * n) + i) / n;
    };
  };
}
