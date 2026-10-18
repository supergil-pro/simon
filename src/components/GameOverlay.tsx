import './GameOverlay.css';

type Props = {
  outcome: 'won' | 'lost';
  completedRounds: number;
};

function completedText(n: number) {
  if (n === 0) return <>לא השלמת אף שלב</>;
  if (n === 1) return <>השלמת שלב אחד</>;
  return (
    <>
      השלמת <bdi>{n}</bdi> שלבים
    </>
  );
}

export default function GameOverlay({ outcome, completedRounds }: Props) {
  return (
    <div className="game-overlay" role="status">
      {outcome === 'won' ? (
        <p className="game-overlay__title">
          <span className="game-overlay__accent">כל הכבוד!</span>
          <span>ניצחת!</span>
        </p>
      ) : (
        <>
          <p className="game-overlay__title game-overlay__title--loss">נפסלת!</p>
          <p className="game-overlay__detail">{completedText(completedRounds)}</p>
        </>
      )}
    </div>
  );
}
