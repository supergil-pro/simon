import { useState } from 'react';
import NavBar, { type Screen } from './components/NavBar';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import { useGame } from './game/useGame';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  // Game state lives above both screens so it survives screen switches
  const game = useGame();

  const navigate = (next: Screen) => {
    // Temporary until Milestone 3: leaving for About cancels an active game
    if (next === 'about') game.cancel();
    setScreen(next);
  };

  return (
    <div className="app">
      <main className="app__content">
        {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      </main>
      <NavBar active={screen} onNavigate={navigate} />
    </div>
  );
}
