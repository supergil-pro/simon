import './NavBar.css';

export type Screen = 'home' | 'about';

const ITEMS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
];

type Props = {
  active: Screen;
  onNavigate: (screen: Screen) => void;
};

export default function NavBar({ active, onNavigate }: Props) {
  return (
    <nav className="navbar" aria-label="ניווט ראשי">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`navbar__item${active === item.id ? ' is-active' : ''}`}
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
