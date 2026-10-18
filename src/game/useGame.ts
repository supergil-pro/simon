import { useEffect, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { audio } from './audio';
import { randomColor, type Color } from './colors';
import { TIMING } from './config';
import { gameReducer, initialGameState } from './engine';

type Press = { stop: () => void; startedAt: number; timer?: number };

const CONFETTI_COLORS = ['#00d26a', '#ff3b30', '#ffd600', '#00a3ff'];

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [presentedColor, setPresentedColor] = useState<Color | null>(null);
  const [pressedColor, setPressedColor] = useState<Color | null>(null);
  const [audioError, setAudioError] = useState(false);
  const pressRef = useRef<Press | null>(null);
  const endedGameRef = useRef(0);

  // Sequence controller: lead-in, then flash + tone per color at a fixed pace
  useEffect(() => {
    if (state.status !== 'presenting') return;
    const controller = new AbortController();
    const timers: number[] = [];
    let stopTone: (() => void) | null = null;
    const at = (ms: number, fn: () => void) => {
      timers.push(
        window.setTimeout(() => {
          if (!controller.signal.aborted) fn();
        }, ms),
      );
    };

    let t = TIMING.leadInMs;
    state.sequence.forEach((color, i) => {
      at(t, () => {
        setPresentedColor(color);
        stopTone = audio.playTone(color, TIMING.flashMs);
      });
      t += TIMING.flashMs;
      at(t, () => {
        setPresentedColor(null);
        stopTone = null;
        if (i === state.sequence.length - 1) dispatch({ type: 'PRESENTATION_DONE' });
      });
      t += TIMING.gapMs;
    });

    return () => {
      controller.abort();
      timers.forEach((id) => window.clearTimeout(id));
      stopTone?.();
      audio.stopAll();
      setPresentedColor(null);
    };
    // The sequence only changes together with round / gameId
  }, [state.status, state.round, state.gameId]);

  // End of game: sound once per game, confetti on win only
  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return;
    if (endedGameRef.current === state.gameId) return;
    endedGameRef.current = state.gameId;
    // The overlay may cover the pad and swallow pointerup, so release the press here
    pressEnd();
    if (state.status === 'won') {
      audio.playWin();
      void confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.45 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      });
    } else {
      audio.playLoss();
    }
  }, [state.status, state.gameId]);

  useEffect(
    () => () => {
      releasePressNow();
      confetti.reset();
    },
    [],
  );

  function releasePressNow() {
    const p = pressRef.current;
    if (!p) return;
    window.clearTimeout(p.timer);
    p.stop();
    pressRef.current = null;
    setPressedColor(null);
  }

  async function start() {
    try {
      await audio.unlock();
    } catch {
      setAudioError(true);
      return;
    }
    setAudioError(false);
    confetti.reset();
    dispatch({ type: 'START', firstColor: randomColor() });
  }

  function pressStart(color: Color) {
    if (state.status !== 'awaitingInput') return;
    releasePressNow();
    const correct = color === state.sequence[state.inputIndex];
    // A wrong press gets a highlight only; the loss sound follows
    const stop = correct ? audio.playTone(color) : () => {};
    pressRef.current = { stop, startedAt: Date.now() };
    setPressedColor(color);
    dispatch({ type: 'PRESS', color, nextColor: randomColor() });
  }

  function pressEnd() {
    const p = pressRef.current;
    if (!p || p.timer !== undefined) return;
    const finish = () => {
      p.stop();
      if (pressRef.current === p) {
        pressRef.current = null;
        setPressedColor(null);
      }
    };
    const remaining = TIMING.minPressMs - (Date.now() - p.startedAt);
    if (remaining > 0) p.timer = window.setTimeout(finish, remaining);
    else finish();
  }

  function cancel() {
    releasePressNow();
    dispatch({ type: 'CANCEL' });
  }

  return {
    state,
    activeColor: presentedColor ?? pressedColor,
    pressedColor,
    audioError,
    start,
    pressStart,
    pressEnd,
    cancel,
  };
}

export type Game = ReturnType<typeof useGame>;
