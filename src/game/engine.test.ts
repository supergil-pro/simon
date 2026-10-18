import { randomColor, type Color } from './colors';
import { gameReducer, initialGameState, type GameState } from './engine';

const start = (first: Color = 'green') => gameReducer(initialGameState, { type: 'START', firstColor: first });
const done = (s: GameState) => gameReducer(s, { type: 'PRESENTATION_DONE' });
const press = (s: GameState, color: Color, nextColor: Color = 'red') =>
  gameReducer(s, { type: 'PRESS', color, nextColor });

// Replays the whole current sequence correctly, appending `next` on round completion
function completeRound(s: GameState, next: Color): GameState {
  let state = done(s);
  for (const color of state.sequence) state = press(state, color, next);
  return state;
}

describe('gameReducer', () => {
  it('starts round 1 with a single color', () => {
    const s = start('blue');
    expect(s).toMatchObject({ status: 'presenting', round: 1, sequence: ['blue'], inputIndex: 0, completedRounds: 0 });
  });

  it('grows by one color per round and each sequence is a prefix of the next', () => {
    const nexts: Color[] = ['red', 'red', 'yellow', 'blue', 'green', 'green', 'red', 'blue', 'yellow'];
    let s = start('green');
    const lengths = [s.sequence.length];
    for (const next of nexts) {
      const prev = s.sequence;
      s = completeRound(s, next);
      expect(s.sequence.slice(0, prev.length)).toEqual(prev);
      expect(s.sequence.at(-1)).toBe(next);
      lengths.push(s.sequence.length);
    }
    expect(lengths[0]).toBe(1);
    expect(lengths[1]).toBe(2);
    expect(lengths[9]).toBe(10);
    expect(s.round).toBe(10);
    // Repeated adjacent colors are allowed
    expect(s.sequence.slice(1, 3)).toEqual(['red', 'red']);
  });

  it('ignores presses while presenting, idle or finished', () => {
    const presenting = start('green');
    expect(press(presenting, 'green')).toBe(presenting);
    expect(press(initialGameState, 'green')).toBe(initialGameState);
    const lost = press(done(presenting), 'red');
    expect(press(lost, 'green')).toBe(lost);
  });

  it('a correct press advances the input index only', () => {
    let s = completeRound(start('green'), 'blue'); // round 2: green, blue
    s = press(done(s), 'green');
    expect(s).toMatchObject({ status: 'awaitingInput', round: 2, inputIndex: 1 });
  });

  it('a wrong press in round 1 loses with 0 completed rounds', () => {
    const s = press(done(start('green')), 'yellow');
    expect(s).toMatchObject({ status: 'lost', completedRounds: 0, round: 1 });
  });

  it('a wrong press in an advanced round loses with round - 1 completed', () => {
    let s = start('green');
    for (let i = 0; i < 4; i++) s = completeRound(s, 'red'); // now round 5
    s = done(s);
    s = press(s, 'green');
    s = press(s, 'blue'); // wrong at position 2
    expect(s).toMatchObject({ status: 'lost', round: 5, completedRounds: 4 });
  });

  it('completing round 10 wins with 10 completed rounds and no round 11', () => {
    let s = start('green');
    for (let i = 0; i < 9; i++) s = completeRound(s, 'green');
    expect(s.round).toBe(10);
    s = completeRound(s, 'green');
    expect(s).toMatchObject({ status: 'won', round: 10, completedRounds: 10 });
    expect(s.sequence).toHaveLength(10);
    expect(press(s, 'green')).toBe(s);
    expect(done(s)).toBe(s);
  });

  it('play again starts a fresh game from round 1', () => {
    const lost = press(done(start('green')), 'red');
    const again = gameReducer(lost, { type: 'START', firstColor: 'yellow' });
    expect(again).toMatchObject({ status: 'presenting', round: 1, sequence: ['yellow'], completedRounds: 0 });
    expect(again.gameId).toBe(lost.gameId + 1);
  });

  it('cancel returns an active game to idle', () => {
    const s = gameReducer(start(), { type: 'CANCEL' });
    expect(s).toMatchObject({ status: 'idle', round: 1, sequence: [] });
  });
});

describe('randomColor', () => {
  it('maps Math.random onto the four colors', () => {
    const spy = vi.spyOn(Math, 'random');
    const picks = [0, 0.3, 0.6, 0.99].map((v) => {
      spy.mockReturnValueOnce(v);
      return randomColor();
    });
    expect(picks).toEqual(['green', 'red', 'yellow', 'blue']);
    spy.mockRestore();
  });
});
