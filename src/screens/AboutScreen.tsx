import './AboutScreen.css';

export default function AboutScreen() {
  return (
    <section className="about">
      <header className="screen-header">
        <h1>אודות</h1>
      </header>

      <section className="card about__intro" aria-labelledby="about-game-title">
        <h2 id="about-game-title">על המשחק</h2>
        <p>זכור את רצף הצבעים שמוצג.</p>
        <p>לחץ על הצבעים באותו סדר.</p>
        <p>נסה להגיע עד שלב 10!</p>
      </section>

      <section className="about__history" aria-labelledby="about-history-title">
        <h2 id="about-history-title">10 המשחקים האחרונים</h2>
        <p className="card about__empty">אין עדיין משחקים שמורים.</p>
      </section>
    </section>
  );
}
