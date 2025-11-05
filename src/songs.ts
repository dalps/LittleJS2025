import { repeat } from "./mathUtils";
import { Song } from "./music";

export let paarynasAllrite: Song | undefined;
export let stardustMemories: Song | undefined;

// prettier-ignore
const idle = [
[0, ],
[0, ],
[0, ],
[0, ],
];

// prettier-ignore
const p2 = [
  [2, ],
  [1, ],
  [1, ],
  [1, ],
];

// prettier-ignore
const p3 = [
  [1, ],
  [0, ],
  [1, ],
  [1, ],
];

// prettier-ignore
const p4 = [
  [0, ],
  [1, ],
  [0, ],
  [1, ],
];

export function initSongs() {
  paarynasAllrite = new Song("./songs/paarynas-allrite.mp3", 102.4, {
    title: "Paaryna's allrite",
    author: "by DIZZY / CNDC",
    year: "1995",
    href: "https://modarchive.org/index.php?request=view_by_moduleid&query=90188",
    choreography: [repeat(idle, 4), repeat(p4, 16)].flat(),
  });

  {
    // prettier-ignore
    const idle = [
      [0, ],
      [0, ],
      [0, ],
      [0, ],
    ];

    // prettier-ignore
    const p2 = [
      [0, ],
      [1, ],
      [0, ],
      [1, ],
    ];

    // prettier-ignore
    const p3 = [
      [3, ],
      [1, ],
      [1, ],
      [1, ],
    ];

    stardustMemories = new Song("./songs/stardustmemories.mp3", 125, {
      title: "Stardust Memories",
      author: "by Jester / Sanity",
      year: "1992",
      href: "https://modarchive.org/index.php?request=view_by_moduleid&query=59344",
      choreography: [
        repeat(idle, 4),
        repeat(p2, 16),
        repeat([p2, p3], 4).flat(),
        repeat(p2, 4),
      ].flat(),
    });
  }
}
