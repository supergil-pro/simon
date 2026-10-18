import { act, fireEvent, render, screen, within } from '@testing-library/react';
import confetti from 'canvas-confetti';
import App from './App';
import { audio } from './game/audio';
import type { Color } from './game/colors';

vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { reset: vi.fn() }) }));
vi.mock('./game/audio', () => ({
  audio: {
    unlock: vi.fn(() => Promise.resolve()),
    playTone: vi.fn(() => vi.fn()),
    playWin: vi.fn(),
    playLoss: vi.fn(),
    stopAll: vi.fn(),
  },
}));

const LABEL: Record<Color, string> = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' };
const pad = (c: Color) =>
  within(screen.getByRole('group', { name: 'לוח המשחק' })).getByRole('button', { name: LABEL[c] });
const roundText = (n: number) =>
  screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === `שלב ${n} מתוך 10`);

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

async function clickStart(name = 'התחל') {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

function tap(c: Color) {
  act(() => {
    fireEvent.pointerDown(pad(c));
    fireEvent.pointerUp(pad(c));
  });
}

// Lead-in + full playback of a sequence of length n
const playbackMs = (n: number) => 800 + n * 600 + (n - 1) * 250;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0); // always green
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Game flow', () => {
  it('presents the sequence at the fixed pace, then hands the turn to the player', async () => {
    render(<App />);
    await clickStart();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(screen.getByText('המתן...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל' })).not.toBeInTheDocument();
    roundText(1);

    await advance(799);
    expect(pad('green')).not.toHaveClass('is-active');
    await advance(1);
    expect(pad('green')).toHaveClass('is-active');
    // Flames are for player presses only, not for sequence playback
    expect(pad('green').querySelector('.pad-flame')).toBeNull();
    expect(audio.playTone).toHaveBeenCalledWith('green', 600);
    await advance(600);
    expect(pad('green')).not.toHaveClass('is-active');
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.getByText('הקש על הצבעים לפי הסדר')).toBeInTheDocument();

    // Round 2: same timings; the second color lights 250ms after the first goes off
    tap('green');
    roundText(2);
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    await advance(800);
    expect(pad('green')).toHaveClass('is-active');
    await advance(600);
    expect(pad('green')).not.toHaveClass('is-active');
    await advance(249);
    expect(pad('green')).not.toHaveClass('is-active');
    await advance(1);
    expect(pad('green')).toHaveClass('is-active');
    await advance(600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('ignores presses while the sequence is presented', async () => {
    render(<App />);
    await clickStart();
    await advance(900);
    tap('red'); // would be wrong if accepted
    await advance(1000);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.queryByText('נפסלת!')).not.toBeInTheDocument();
  });

  it('loses immediately on a wrong press in round 1, without confetti', async () => {
    render(<App />);
    await clickStart();
    await advance(playbackMs(1));
    // Pointer released elsewhere (the overlay covers the pad) – highlight still clears
    act(() => {
      fireEvent.pointerDown(pad('blue'));
    });
    expect(pad('blue')).toHaveClass('is-active');
    expect(pad('blue').querySelector('.pad-flame')).not.toBeNull();
    await advance(250);
    expect(pad('blue')).not.toHaveClass('is-active');
    expect(pad('blue').querySelector('.pad-flame')).toBeNull();
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('לא השלמת אף שלב')).toBeInTheDocument();
    expect(audio.playLoss).toHaveBeenCalledTimes(1);
    expect(audio.playWin).not.toHaveBeenCalled();
    expect(confetti).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'שחק שוב' })).toBeInTheDocument();
  });

  it('shows completed rounds when losing in an advanced round', async () => {
    render(<App />);
    await clickStart();
    for (let n = 1; n <= 3; n++) {
      await advance(playbackMs(n));
      for (let i = 0; i < n; i++) tap('green');
    }
    roundText(4);
    await advance(playbackMs(4));
    tap('green');
    tap('yellow');
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'השלמת 3 שלבים'),
    ).toBeInTheDocument();
  });

  it('wins after completing round 10 with confetti once, and play again starts fresh', async () => {
    render(<App />);
    await clickStart();
    for (let n = 1; n <= 10; n++) {
      roundText(n);
      await advance(playbackMs(n));
      for (let i = 0; i < n; i++) tap('green');
    }
    expect(screen.getByText('כל הכבוד!')).toBeInTheDocument();
    expect(screen.getByText('ניצחת!')).toBeInTheDocument();
    roundText(10);
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(audio.playLoss).not.toHaveBeenCalled();

    // No round 11: nothing more is presented
    await advance(5000);
    expect(screen.getByText('ניצחת!')).toBeInTheDocument();
    expect(audio.playTone).toHaveBeenCalledTimes(55 + 55); // 55 sequence flashes + 55 correct presses

    vi.mocked(Math.random).mockReturnValue(0.99); // blue
    await clickStart('שחק שוב');
    roundText(1);
    expect(screen.queryByText('ניצחת!')).not.toBeInTheDocument();
    expect(confetti.reset).toHaveBeenCalled();
    await advance(800);
    expect(pad('blue')).toHaveClass('is-active');
  });

  it('navigating to About mid-game stops playback and returns to the start state', async () => {
    render(<App />);
    await clickStart();
    await advance(900);
    expect(pad('green')).toHaveClass('is-active');
    const nav = screen.getByRole('navigation');
    act(() => {
      fireEvent.click(within(nav).getByRole('button', { name: 'אודות' }));
    });
    expect(audio.stopAll).toHaveBeenCalled();
    await advance(5000);
    act(() => {
      fireEvent.click(within(nav).getByRole('button', { name: 'בית' }));
    });
    roundText(1);
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
    expect(pad('green')).not.toHaveClass('is-active');
    expect(audio.playLoss).not.toHaveBeenCalled();
  });

  it('shows an error and does not start when audio cannot be unlocked', async () => {
    vi.mocked(audio.unlock).mockRejectedValueOnce(new Error('blocked'));
    render(<App />);
    await clickStart();
    expect(screen.getByRole('alert')).toHaveTextContent('לא ניתן להפעיל את הצלילים. לחץ שוב כדי לנסות.');
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
    await advance(2000);
    expect(audio.playTone).not.toHaveBeenCalled();

    await clickStart();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });
});
