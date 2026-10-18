import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import GameOverlay from '../components/GameOverlay';
import { TOTAL_ROUNDS } from '../game/colors';
import type { Game } from '../game/useGame';
import './HomeScreen.css';

type Props = { game: Game };

export default function HomeScreen({ game }: Props) {
  const { state, activeColor, audioError } = game;
  const { status } = state;
  const ended = status === 'won' || status === 'lost';

  let statusText = '';
  let hint = '';
  if (status === 'presenting') {
    statusText = 'המשחק מציג את הרצף';
    hint = 'המתן...';
  } else if (status === 'awaitingInput') {
    statusText = 'התור שלך';
    hint = 'הקש על הצבעים לפי הסדר';
  }

  return (
    <section className="home">
      <header className="screen-header">
        <h1>סיימון</h1>
      </header>
      <p className="home__round">
        שלב <bdi>{state.round}</bdi> מתוך <bdi>{TOTAL_ROUNDS}</bdi>
      </p>
      <p className="home__status" aria-live="polite">
        {statusText}
      </p>
      <div className="home__board">
        <SimonBoard
          activeColor={activeColor}
          flameColor={game.pressedColor}
          dimmed={status === 'presenting' || ended}
          interactive={status === 'awaitingInput'}
          onPressStart={game.pressStart}
          onPressEnd={game.pressEnd}
        />
        {ended && <GameOverlay outcome={status} completedRounds={state.completedRounds} />}
      </div>
      <div className="home__actions">
        {audioError && (
          <p className="home__error" role="alert">
            לא ניתן להפעיל את הצלילים. לחץ שוב כדי לנסות.
          </p>
        )}
        {status === 'idle' && <PrimaryButton onClick={game.start}>התחל</PrimaryButton>}
        {ended && <PrimaryButton onClick={game.start}>שחק שוב</PrimaryButton>}
        {hint && <p className="home__hint">{hint}</p>}
      </div>
    </section>
  );
}
