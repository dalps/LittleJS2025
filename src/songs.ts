import { LOG, vec2 } from "littlejsengine";
import { beatCount, type Pattern } from "./beat";
import { Microbe, MicrobeAction as MicrobeAction } from "./entities/microbe";
import { polar, repeat, rgba } from "./mathUtils";
import { Song } from "./music";

export let paarynasAllrite: Song;
export let stardustMemories: Song;
export let myFirstConsoleTutorial: Song;

const { Idle: ____, Swim, Turn, Wink, Ding } = MicrobeAction;

const I_I_ = [
  [____], //
  [],
  [____],
  [],
];

const _I_I = [
  [____], //
  [],
  [____],
  [],
];

const S_S_ = [
  [Swim], //
  [____],
  [Swim],
  [____],
];

const _S_S = [
  [____], //
  [Swim],
  [____],
  [Swim],
];

const ding1 = [
  [Ding], //
  [Swim],
  [Swim],
  [Swim],
];

const ding2 = [
  [Swim], //
  [Ding],
  [Swim],
  [Swim],
];

export function initSongs() {
  {
    const _T_S = [
      [____], //
      [Turn],
      [____],
      [Swim],
    ];

    const SS__ = [
      [Swim], //
      [Swim],
      [____],
      [____],
    ];

    paarynasAllrite = new Song("./songs/paarynas-allrite.mp3", 102.4, {
      title: "Paaryna's allrite",
      author: "by DIZZY / CNDC",
      year: "1995",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=90188",
      color: rgba(5, 52, 106, 1),
      choreography: [
        repeat(I_I_, 4),
        repeat(_S_S, 8),
        [_T_S],
        repeat(_S_S, 7),
        [_T_S],
        repeat([S_S_, SS__], 7).flat(),
        [_T_S],
        repeat([S_S_, SS__], 7).flat(),
      ].flat(),
    });
  }

  {
    // prettier-ignore
    const idle = [
      [____, ],
      [____, ],
      [____, ],
      [____, ],
    ];

    // prettier-ignore
    const mid = [
      [____, ],
      [Swim, ],
      [____, ],
      [Swim, ],
    ];

    // prettier-ignore
    const mid2 = [
      [____, ],
      [Swim, ],
      [____, ],
      [Swim, ],
    ];

    // prettier-ignore
    const end = [
      [____, ],
      [____, ],
      [ , ],
      [Wink, ],
    ];

    // prettier-ignore
    const empty = [
      [ , ],
      [ , ],
      [ , ],
      [ , ],
    ];

    stardustMemories = new Song("./songs/stardustmemories.mp3", 125, {
      title: "Stardust Memories",
      author: "by Jester / Sanity",
      year: "1992",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=59344",
      color: rgba(93, 14, 76, 1),
      choreography: [
        repeat(idle, 4),
        repeat(mid, 7),
        [mid2],
        repeat(mid, 8),
        repeat([mid, ding1], 4).flat(),
        [mid, mid2, mid, mid],
        [idle, end, empty],
      ].flat(),
    });

    myFirstConsoleTutorial = new Song("./songs/myfirstconsole.mp3", 144, {
      title: "My First Console",
      author: "by aceman",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=157368",
      color: rgba(135, 101, 6, 1),
      choreography: tutorialChoreo1,
    });
  }
}

export const tutorialChoreo1 = [repeat(I_I_, 2), repeat(S_S_, 8)].flat();
export const tutorialChoreo2 = [repeat(I_I_, 2), repeat(_S_S, 8)].flat();
export const tutorialChoreo3 = [
  repeat(I_I_, 2),
  repeat([S_S_, ding2], 32).flat(),
].flat();

export const countSwimActions = (choreography: Pattern<MicrobeAction>) =>
  choreography.flat(3).filter((a) => a === MicrobeAction.Swim).length;
