import type { CSSProperties, MouseEvent } from 'react';
import { BOARD_COLORS, COLOR_LABELS, type Color } from '../game/colors';
import './SimonBoard.css';

// Fixed flame-tongue layout (position %, size px, animation offset s) – spread over the pad
const TONGUES = [
  { x: -6, y: 55, size: 40, delay: 0 },
  { x: 8, y: 20, size: 50, delay: -0.31 },
  { x: 22, y: 78, size: 36, delay: -0.62 },
  { x: 30, y: -4, size: 54, delay: -0.15 },
  { x: 45, y: 40, size: 44, delay: -0.47 },
  { x: 55, y: 96, size: 38, delay: -0.78 },
  { x: 62, y: 6, size: 52, delay: -0.24 },
  { x: 78, y: 60, size: 42, delay: -0.55 },
  { x: 88, y: 22, size: 50, delay: -0.07 },
  { x: 104, y: 50, size: 40, delay: -0.39 },
  { x: 96, y: 90, size: 34, delay: -0.7 },
  { x: 4, y: 100, size: 34, delay: -0.86 },
];

function Flames() {
  return (
    <span className="pad-flame" aria-hidden="true">
      {TONGUES.map((t, i) => (
        <i
          key={i}
          style={
            {
              left: `${t.x}%`,
              top: `${t.y}%`,
              '--size': `${t.size}px`,
              animationDelay: `${t.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

type Props = {
  activeColor?: Color | null;
  flameColor?: Color | null;
  dimmed?: boolean;
  interactive?: boolean;
  onPressStart?: (color: Color) => void;
  onPressEnd?: () => void;
};

export default function SimonBoard({
  activeColor = null,
  flameColor = null,
  dimmed = false,
  interactive = false,
  onPressStart,
  onPressEnd,
}: Props) {
  const end = () => onPressEnd?.();

  // Keyboard activation (Enter / Space) fires a click with detail 0
  const handleClick = (color: Color) => (e: MouseEvent) => {
    if (e.detail !== 0 || !interactive) return;
    onPressStart?.(color);
    end();
  };

  return (
    <div className={`simon-board${dimmed ? ' simon-board--dimmed' : ''}`} role="group" aria-label="לוח המשחק">
      {BOARD_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`simon-board__pad simon-board__pad--${color}${activeColor === color ? ' is-active' : ''}`}
          aria-label={COLOR_LABELS[color]}
          aria-disabled={interactive ? undefined : true}
          onPointerDown={() => {
            if (interactive) onPressStart?.(color);
          }}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          onClick={handleClick(color)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {flameColor === color && <Flames />}
        </button>
      ))}
      <div className="simon-board__center" aria-hidden="true" />
    </div>
  );
}
