import type { Pattern } from "./beat";
import { MicrobeAction as MicrobeAction } from "./entities/microbe";
import { repeat, rgba } from "./mathUtils";
import { Song } from "./music";

export let paarynasAllrite: Song | undefined;
export let stardustMemories: Song | undefined;

const { Idle: ____, Swim, Turn, Wink, Ding } = MicrobeAction;

export function initSongs() {
  {
    const idle = [
      [____], //
      [____],
      [____],
      [____],
    ];

    const p1 = [
      [____], //
      [Swim],
      [____],
      [Swim],
    ];

    const p2 = [
      [____], //
      [Turn],
      [____],
      [Swim],
    ];

    const p3 = [
      [Swim], //
      [____],
      [Swim],
      [____],
    ];

    const p4 = [
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
        repeat(idle, 4),
        repeat(p1, 8),
        [p2],
        repeat(p1, 7),
        [p2],
        repeat([p3, p4], 7).flat(),
        [p2],
        repeat([p3, p4], 7).flat(),
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
    const ding = [
      [Ding, ],
      [Swim, ],
      [Swim, ],
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
        repeat([mid, ding], 4).flat(),
        [mid, mid2, mid, mid],
        [idle, end, empty],
      ].flat(),
    });
  }
}

export const countSwimActions = (choreography: Pattern<MicrobeAction>) =>
  choreography.flat(3).filter((a) => a === MicrobeAction.Swim).length;
