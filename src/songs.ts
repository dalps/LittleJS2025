import { type Pattern } from "./beat";
import { MicrobeAction } from "./entities/microbe";
import { repeat, rgba } from "./mathUtils";
import { Song } from "./music";

export let paarynasAllrite: Song;
export let stardustMemories: Song;
export let woodenShoes: Song;
export let myFirstConsole: Song;
export let myFirstConsoleTutorial: Song;
export let tryAgainTune: Song;
export let goodEnoughTune: Song;
export let superbTune: Song;

const { Idle: ____, Swim, Turn, Wink, Ding } = MicrobeAction;

const I_I_ = [
  [____], //
  [],
  [____],
  [],
];

const _I_I = [
  [],
  [____], //
  [],
  [____],
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

const DSSS = [
  [Ding], //
  [Swim],
  [Swim],
  [Swim],
];

const SDSS = [
  [Swim], //
  [Ding],
  [Swim],
  [Swim],
];

const _DSS = [
  [____], //
  [Ding],
  [Swim],
  [Swim],
];

const IIII = [
  [____], //
  [____],
  [____],
  [____],
];

const empty = repeat([,], 4);

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

    paarynasAllrite = new Song("./songs/paarynas-allrite.mp3", {
      bpm: 102.45,
      title: "Paaryna's allrite",
      author: "DIZZY / CNDC",
      year: "1995",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=90188",
      color: rgba(5, 52, 106, 1),
      // choreography: [
      //   repeat(I_I_, 4),
      //   repeat(_S_S, 8),
      //   repeat([_T_S, repeat(_S_S, 7).flat()], 3).flat(),
      // ].flat(),
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
    const end = [
      [____], //
      [____],
      [],
      [Wink],
    ];

    stardustMemories = new Song("./songs/stardustmemories.mp3", {
      bpm: 125,
      title: "Stardust Memories",
      author: "Jester / Sanity",
      year: "1992",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=59344",
      color: rgba(93, 14, 76, 1),
      choreography: [
        repeat(IIII, 4),
        repeat(_S_S, 7),
        [_S_S],
        repeat(_S_S, 8),
        repeat([_S_S, DSSS], 4).flat(),
        [_S_S, _S_S, _S_S, _S_S],
        [IIII, end, empty],
      ].flat(),
    });
  }

  let myFirstConsoleData = {
    bpm: 144,
    title: "My First Console",
    author: "aceman",
    href: "https://modarchive.org/index.php?request=view_by_moduleid&query=157368",
  };

  myFirstConsoleTutorial = new Song("./songs/myfirstconsole.mp3", {
    ...myFirstConsoleData,
    color: rgba(6, 135, 66, 1),
    choreography: tutorialChoreo1,
  });

  {
    const end = [
      [], //
      [Wink],
      [],
      [],
    ];

    myFirstConsole = new Song("./songs/myfirstconsole_extended.mp3", {
      ...myFirstConsoleData,
      color: rgba(6, 135, 133, 1),
      choreography: [
        repeat(I_I_, 2),
        repeat(S_S_, 7),
        [SDSS], // 10
        repeat(S_S_, 7),
        [SDSS], // 18
        repeat(S_S_, 7),
        [SDSS], // 26
        repeat(S_S_, 7),
        [DSSS], // 34
        repeat(_S_S, 7), // 35 on
        [DSSS],
        repeat(_S_S, 7), // 50
        [
          [
            [],
            [Swim], //
            [],
            [____],
          ],
        ],
        [empty, end, empty],
      ].flat(),
    });
  }

  {
    const end = [
      [], //
      [Wink],
      [],
      [],
    ];
    woodenShoes = new Song("./songs/wooden_shoes.mp3", {
      bpm: 160,
      title: "Wooden Shoes",
      author: "woolter",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=65483",
      color: rgba(164, 168, 101, 1),
      choreography: [
        // bars: 39
        repeat(I_I_, 3),
        [
          [
            [____],
            [], //
            [____],
            [____],
          ],
        ],
        repeat([repeat(_S_S, 3), [DSSS]].flat(), 5).flat(),
        repeat(_S_S, 3),
        [_DSS], // 28
        repeat(S_S_, 9),
        [DSSS], // 32
        // [
        //   [
        //     [Swim], //
        //     [],
        //     [Swim],
        //     [Ding],
        //   ],
        // ],
        // [
        //   [
        //     [Swim], //
        //     [Swim],
        //     [Swim],
        //     [],
        //   ],
        // ],
        [empty, end, empty],
      ].flat(),
    });
  }

  tryAgainTune = new Song("./songs/0_percent_oxygen.mp3", {
    title: "0% oxygen",
    author: "mildewy",
    href: "https://modarchive.org/index.php?request=view_by_moduleid&query=210337",
  });

  goodEnoughTune = new Song("", { bpm: 0 });

  superbTune = new Song("./songs/hlorophobia_snip.mp3", {
    title: "!!! hlorofobia !!!",
    author: "klaf",
    href: "https://modarchive.org/index.php?request=view_by_moduleid&query=106734",
  });
}

export const tutorialChoreo1 = [repeat(I_I_, 2), repeat(S_S_, 8)].flat();
export const tutorialChoreo2 = [repeat(I_I_, 2), repeat(_S_S, 8)].flat();
export const tutorialChoreo3 = [
  repeat(I_I_, 2),
  repeat([S_S_, SDSS], 32).flat(),
].flat();

export const countSwimActions = (choreography: Pattern<MicrobeAction>) =>
  choreography.flat(3).filter((a) => a === MicrobeAction.Swim).length;
