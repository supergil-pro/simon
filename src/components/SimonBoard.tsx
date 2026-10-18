import { BOARD_COLORS, COLOR_LABELS } from '../game/colors';
import './SimonBoard.css';

export default function SimonBoard() {
  return (
    <div className="simon-board" role="group" aria-label="לוח המשחק">
      {BOARD_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`simon-board__pad simon-board__pad--${color}`}
          aria-label={COLOR_LABELS[color]}
        />
      ))}
      <div className="simon-board__center" aria-hidden="true" />
    </div>
  );
}
