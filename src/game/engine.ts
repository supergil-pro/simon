import { TOTAL_ROUNDS, type Color } from './colors';

export type GameStatus = 'idle' | 'presenting' | 'awaitingInput' | 'won' | 'lost';

export type GameState = {
  status: GameStatus;
  sequence: Color[];
  round: number;
  inputIndex: number;
  completedRounds: number;
  gameId: number;
};

// Random colors are generated outside the reducer and passed in, keeping it pure
export type GameAction =
  | { type: 'START'; firstColor: Color }
  | { type: 'PRESENTATION_DONE' }
  | { type: 'PRESS'; color: Color; nextColor: Color }
  | { type: 'CANCEL' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      if (state.status !== 'idle' && state.status !== 'won' && state.status !== 'lost') return state;
      return {
        status: 'presenting',
        sequence: [action.firstColor],
        round: 1,
        inputIndex: 0,
        completedRounds: 0,
        gameId: state.gameId + 1,
      };

    case 'PRESENTATION_DONE':
      if (state.status !== 'presenting') return state;
      return { ...state, status: 'awaitingInput', inputIndex: 0 };

    case 'PRESS': {
      if (state.status !== 'awaitingInput') return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'lost', completedRounds: state.round - 1 };
      }
      const nextIndex = state.inputIndex + 1;
      if (nextIndex < state.sequence.length) {
        return { ...state, inputIndex: nextIndex };
      }
      if (state.round >= TOTAL_ROUNDS) {
        return { ...state, status: 'won', inputIndex: nextIndex, completedRounds: TOTAL_ROUNDS };
      }
      return {
        ...state,
        status: 'presenting',
        sequence: [...state.sequence, action.nextColor],
        round: state.round + 1,
        inputIndex: 0,
        completedRounds: state.round,
      };
    }

    case 'CANCEL':
      // Temporary until Milestone 3 (pause/resume): leaving mid-game discards it
      if (state.status !== 'presenting' && state.status !== 'awaitingInput') return state;
      return { ...initialGameState, gameId: state.gameId };

    default:
      return state;
  }
}
