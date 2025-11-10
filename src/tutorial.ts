import * as LJS from "littlejsengine";
import { speech, SpeechBubble } from "./uiUtils";
import {
  center,
  clearRow,
  currentSong,
  GameState,
  makeRow,
  setCurrentSong,
  setGameState,
  spriteAtlas,
  titleMenu,
  titleScreen,
  titleText,
} from "./main";
import type { Microbe } from "./entities/microbe";
import { goodThreshold, type Player } from "./entities/player";
import {
  myFirstConsoleTutorial,
  tutorialChoreo2,
  tutorialChoreo3,
} from "./songs";
import { PatternWrapping, type TimingInfo } from "./beat";
import { LOG } from "./mathUtils";
import { tutorialLevel } from "./levels";
import { changeBackground } from "./animUtils";
import { Tween } from "./tween";
const { vec2, rgb, tile } = LJS;

export let hasDoneTutorial = true;
const beatsToHit = 8;

let score = 0;
let beatsLeft = beatsToHit;
let player: Player;

let t1: LJS.UIText;
let t2: LJS.UIText;

export async function tutorial() {
  setGameState(GameState.Tutorial);

  titleText.visible = titleMenu.visible = false;
  changeBackground(tutorialLevel.color);

  setCurrentSong(myFirstConsoleTutorial);
  currentSong.loopStart = 3.333; // 2 bar 1 beat 1 sub

  let row = makeRow({
    playerIdx: 1,
    wrapping: PatternWrapping.HoldLast,
  }) as [Microbe, Player, Microbe];
  let [leader] = row;

  player = row[1];
  player.interactive = false;

  t1 = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    vec2(1000, 20)
  );
  t2 = new LJS.UIText(vec2(0, 40), vec2(1000, 40));
  t1.addChild(t2);
  t1.textColor = t2.textColor = LJS.WHITE;
  t1.shadowColor = t2.shadowColor = LJS.BLACK;

  const pos = () => {
    LOG(leader.pos, LJS.worldToScreen(leader.pos));
    // this sometimes ends up in a different place, possibly due to camera motion?
    // return LJS.worldToScreen(leader.pos).subtract(vec2(0, 100));

    return center.multiply(vec2(1, 0.3));
  };

  new Tween((t) => t === 1 && row.forEach((m) => m.wink()), 0, 1, 360).then(
    Tween.Loop
  );

  await speech(pos(), "Hello there!");
  leader.idle();
  await speech(pos(), "Welcome to the mitochondrion.");
  await speech(pos(), "We are in charge of cellular respiration.");
  leader.idle();
  await speech(pos(), "That means we must burn calories\nto fuel up the cell!");
  // await speech(pos(), "We march all day long to burn oxygen.");
  // await speech(pos(), "It's a process called cellular respiration.");
  await speech(pos(), `We do that by marching to the rhythm of a beat.`);
  await speech(pos(), `Let us teach you our tiny march.`);
  leader.idle();
  await speech(pos(), `Get ready for the first pattern!`);
  t1.text = `Click on the 1st and 3rd beat.`;
  testPlayer([1, 3], async (finalScore) => {
    LOG(`finalScore: ${finalScore}`);

    await speech(pos(), finalScore >= 0.85 ? `Nice going!` : `.Not bad!`);
    new LJS.UITile(pos(), vec2(50), spriteAtlas.hoop_metronome);
    await speech(pos(), `Now, let's try a different pattern.`);
    await speech(pos(), `This time, we'll march to the offbeat.`);
    await speech(pos(), `Ready?`);
    currentSong.setChoreography(tutorialChoreo2);
    row.forEach((m) => m.setChoreography()); // song should take care of this

    t1.text = `Click on the 2nd and 4th beat.`;
    testPlayer([2, 4], async (finalScore) => {
      LOG(`finalScore: ${finalScore}`);
      await speech(pos(), finalScore >= 0.85 ? `Sweet!` : `Good effort.`);
      await speech(pos(), `One last pattern.`);
      await speech(pos(), `When you hear a bell ding...`);
      await speech(pos(), `...swim for the next three beats!`);
      await speech(pos(), `Ok, here we go!`);
      currentSong.setChoreography(tutorialChoreo3);
      row.forEach((m) => m.setChoreography());

      t1.text = `Click for the next three beats after the ding.`;
      testPlayer([2, 3, 4], async () => {
        await speech(
          pos(),
          finalScore >= 0.85 ? `You got rhythm!` : `I think you're ready.`
        );
        await speech(pos(), `Congrats!\nYou completed the tutorial!`);
        await speech(pos(), `Now, march on to the main levels.`);
        titleScreen();
      });
    });
  });
  tutorialLevel.completed = true;
}

function testPlayer(
  /** Which beats should the player hit? */
  beats: number[],
  /** What happens after the player passes the test */
  onComplete: (score: number) => void,
  /** What happens after the player makes hit a beat correctly */
  onProgress?: () => void
) {
  score = 0;
  beatsLeft = beatsToHit;
  t2.text = `${beatsToHit} times left.`;
  t1.visible = true;

  currentSong.addMetronome();
  currentSong.play({ loop: true });

  player.interactive = true;

  player.onClick = ({ accuracy, count: [currentBeat] }: TimingInfo) => {
    const correctBeat = beats.find((b) => b === currentBeat);
    // LOG(`${currentBeat} vs ${beats}: ${correctBeat}`);

    if (correctBeat && accuracy >= goodThreshold) {
      t2.text = `${beatsLeft} times left.`;
      onProgress && onProgress();

      LOG(`${score} (+${accuracy})`);
      score += accuracy;
      if (--beatsLeft < 0) {
        currentSong.stop();
        player.interactive = false;
        t1.visible = false;
        onComplete(score / beatsToHit);
      }
    }
  };
}
