import SimonBoard from '../components/SimonBoard';
import PrimaryButton from '../components/PrimaryButton';
import { TOTAL_ROUNDS } from '../game/colors';
import './HomeScreen.css';

export default function HomeScreen() {
  const round = 1;

  return (
    <section className="home">
      <header className="screen-header">
        <h1>סיימון</h1>
      </header>
      <p className="home__round">
        שלב <bdi>{round}</bdi> מתוך <bdi>{TOTAL_ROUNDS}</bdi>
      </p>
      {/* Reserved for game status messages (Milestone 2) */}
      <p className="home__status" aria-live="polite" />
      <div className="home__board">
        <SimonBoard />
      </div>
      <div className="home__actions">
        <PrimaryButton>התחל</PrimaryButton>
      </div>
    </section>
  );
}
