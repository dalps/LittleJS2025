import * as LJS from "littlejsengine";
import { changeBackground, sleep } from "./animUtils";
import { PatternWrapping, type TimingInfo } from "./beat";
import type { Microbe } from "./entities/microbe";
import { goodThreshold, type Player } from "./entities/player";
import { makeRow } from "./entities/row";
import { hideLevels, levelsMenu, pauseBtn, tutorialLevel } from "./levels";
import {
  clearTitleCameraTween,
  currentSong,
  defaultSpeechBubblePos,
  GameState,
  setCurrentSong,
  setGameState,
  titleMenu,
  titleScreen,
  titleText,
  vignette,
} from "./main";
import { LOG } from "./mathUtils";
import { sfx } from "./sfx";
import {
  myFirstConsoleTutorial,
  tutorialChoreo2,
  tutorialChoreo3,
} from "./songs";
import { startBtn } from "./ui";
import { setVisible, speech } from "./uiUtils";
const { vec2, rgb, tile } = LJS;

export let beginTutorial = true;
const beatsToHit = 8;

let score = 0;
let beatsLeft = beatsToHit;
let player: Player;

export let tutorialMessage: LJS.UIText;
let t2: LJS.UIText;

export async function tutorial() {
  startBtn.interactive = false; // important

  await vignette.fade({ duration: 60 });

  hideLevels();
  clearTitleCameraTween();
  setVisible(false, levelsMenu, titleText, titleMenu, pauseBtn);

  setGameState(GameState.Tutorial);

  LJS.setCameraScale(32);
  changeBackground(tutorialLevel.color);

  setCurrentSong(myFirstConsoleTutorial);

  let row = makeRow({
    playerIdx: 1,
    wrapping: PatternWrapping.HoldLast,
  }) as [Microbe, Player, Microbe];
  let [leader] = row;

  player = row[1];
  player.interactive = false;

  tutorialMessage = new LJS.UIText(
    LJS.mainCanvasSize.multiply(vec2(0.5, 0.8)),
    vec2(1000, 20)
  );
  t2 = new LJS.UIText(vec2(0, 40), vec2(1000, 40));
  tutorialMessage.addChild(t2);
  tutorialMessage.textColor = t2.textColor = LJS.WHITE;
  tutorialMessage.shadowColor = t2.shadowColor = LJS.BLACK;

  const pos = () => {
    // this sometimes ends up in a different place, possibly due to camera motion?
    // return LJS.worldToScreen(leader.pos).subtract(vec2(0, 100));
    return defaultSpeechBubblePos;
  };

  await sleep(50);
  await vignette.circleMask({
    endRadius: LJS.mainCanvasSize.x,
  });

  await speech(pos(), "Hello there!");
  leader.idle();
  await speech(pos(), "Welcome to the mitochondrion.");
  await speech(pos(), "We are in charge of cellular respiration.");
  leader.idle();
  await speech(pos(), "That means we must burn calories\nto fuel up the cell!");
  await speech(pos(), `We do that by marching to the rhythm of a beat.`);
  await speech(pos(), `Let's practise single steps now.`);
  await speech(
    pos(),
    `Use the metronome and the visual cues\non the screen to match the beat!`
  );
  leader.idle();
  await speech(pos(), `Ok, get ready for the first pattern!`);
  tutorialMessage.text = `Click on the 1st and 3rd beat.`;
  testPlayer([1, 3], async (finalScore) => {
    LOG(`finalScore: ${finalScore}`);

    await speech(pos(), finalScore >= 0.85 ? `Nice going!` : `Not bad!`);
    await speech(pos(), `Now, let's try a different pattern.`);
    await speech(pos(), `This time, we'll march to the offbeat.`);
    await speech(pos(), `Ready?`);
    currentSong.setChoreography(tutorialChoreo2);
    row.forEach((m) => m.setChoreography()); // song should take care of this

    tutorialMessage.text = `Click on the 2nd and 4th beat.`;
    testPlayer([2, 4], async (finalScore) => {
      LOG(`finalScore: ${finalScore}`);
      await speech(pos(), finalScore >= 0.85 ? `Sweet!` : `Good effort.`);
      await speech(pos(), `One last pattern.`);
      await speech(pos(), `When you hear a bell ding...`);
      await speech(pos(), `...swim for the next three beats!`);
      await speech(pos(), `Ok, here we go!`);
      currentSong.setChoreography(tutorialChoreo3);
      row.forEach((m) => m.setChoreography());

      tutorialMessage.text = `Click for the next three beats after the ding.`;
      testPlayer([2, 3, 4], async () => {
        await speech(
          pos(),
          finalScore >= 0.85 ? `You got rhythm!` : `I think you're ready.`
        );
        await speech(pos(), `Congrats!\nYou completed the tutorial!`);
        await speech(pos(), `Now march on to the main levels.`);

        tutorialLevel.completed = true;
        titleScreen(true);
      });
    });
  });

  beginTutorial = false;
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
  tutorialMessage.visible = true;

  currentSong.addMetronome();
  currentSong.play({ loop: true });

  pauseBtn.visible = player.interactive = true;

  player.onClick = async ({ accuracy, count: [currentBeat] }: TimingInfo) => {
    const correctBeat = beats.find((b) => b === currentBeat);
    // LOG(`${currentBeat} vs ${beats}: ${correctBeat}`);

    if (correctBeat && accuracy >= goodThreshold) {
      t2.text = `${beatsLeft} times left.`;
      onProgress && onProgress();

      LOG(`${score} (+${accuracy})`);
      score += accuracy;
      if (--beatsLeft < 0) {
        currentSong.stop();
        pauseBtn.visible = player.interactive = tutorialMessage.visible = false;

        // ding ding ding
        sfx.ding.play(undefined, 1, 2);
        await sleep(10);
        sfx.ding.play(undefined, 1, 2);
        await sleep(10);
        sfx.ding.play(undefined, 1, 2);
        await sleep(50);

        onComplete(score / beatsToHit);
      }
    }
  };
}
