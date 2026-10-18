import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App shell', () => {
  it('renders the home screen with title, round indicator and start button', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
    // Numbers are wrapped in <bdi>, so match on the paragraph's full text
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'שלב 1 מתוך 10'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
  });

  it('renders four color pads in spatial order', () => {
    render(<App />);
    const board = screen.getByRole('group', { name: 'לוח המשחק' });
    const pads = within(board).getAllByRole('button');
    expect(pads.map((p) => p.getAttribute('aria-label'))).toEqual(['ירוק', 'אדום', 'צהוב', 'כחול']);
  });

  it('has exactly two nav items with the active one marked', () => {
    render(<App />);
    const nav = screen.getByRole('navigation');
    const items = within(nav).getAllByRole('button');
    expect(items).toHaveLength(2);
    expect(within(nav).getByRole('button', { name: 'בית' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'אודות' })).not.toHaveAttribute('aria-current');
  });

  it('navigates to about and back without leaving the page', async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation');

    await user.click(within(nav).getByRole('button', { name: 'אודות' }));
    expect(screen.getByRole('heading', { level: 1, name: 'אודות' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'על המשחק' })).toBeInTheDocument();
    expect(screen.getByText('אין עדיין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'לוח המשחק' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'אודות' })).toHaveAttribute('aria-current', 'page');

    await user.click(within(nav).getByRole('button', { name: 'בית' }));
    expect(screen.getByRole('group', { name: 'לוח המשחק' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל' })).toBeInTheDocument();
  });
});
