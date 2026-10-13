// App.jsx - Main Application entry wiring Three.js engine and React HUD
import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/GameEngine.js';
import { HUD } from './components/HUD.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { ShopModal } from './components/ShopModal.jsx';
import { PauseMenu } from './components/PauseMenu.jsx';
import { GameOverModal } from './components/GameOverModal.jsx';
import { TouchControls } from './components/TouchControls.jsx';

export default function App() {
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [stats, setStats] = useState(null);
  const [hitmarkers, setHitmarkers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [waveBanner, setWaveBanner] = useState({ show: false, wave: 1, message: '' });
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [isRainEnabled, setIsRainEnabled] = useState(false);

  const handleStartGame = (options) => {
    setGameOverData(null);
    setIsPaused(false);
    setIsShopOpen(false);

    if (gameEngineRef.current) {
      gameEngineRef.current.destroy();
      gameEngineRef.current = null;
    }

    const uiCallbacks = {
      setStats,
      addHitmarker: (damage, isHeadshot) => {
        const id = Math.random().toString();
        setHitmarkers(prev => [...prev, { id, damage, isHeadshot }]);
        setTimeout(() => {
          setHitmarkers(prev => prev.filter(h => h.id !== id));
        }, 350);
      },
      showNotification: (text) => {
        const id = Math.random().toString();
        setNotifications(prev => [...prev, { id, text }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3200);
      },
      showWaveBanner: (wave, message) => {
        setWaveBanner({ show: true, wave, message });
        setTimeout(() => {
          setWaveBanner(prev => ({ ...prev, show: false }));
        }, 4000);
      },
      onPauseChange: (paused) => {
        setIsPaused(paused);
      },
      onShopToggle: (open) => {
        setIsShopOpen(open);
      },
      onGameOver: (summary) => {
        setGameOverData(summary);
      }
    };

    if (containerRef.current) {
      const engine = new GameEngine(containerRef.current, uiCallbacks);
      gameEngineRef.current = engine;
      if (options && options.perspective) {
        engine.player.setPerspective(options.perspective);
      }
      engine.particles.toggleRain(isRainEnabled);
      engine.start();
      setGameStarted(true);
    }
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleResume = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.togglePause();
    }
  };

  const handleToggleRain = (enable) => {
    setIsRainEnabled(enable);
    if (gameEngineRef.current) {
      gameEngineRef.current.particles.toggleRain(enable);
    }
  };

  const handleBuyItem = (item) => {
    const engine = gameEngineRef.current;
    if (!engine) return;

    engine.takaCoins -= item.price;

    if (item.id === 'medkit') {
      engine.player.heal(50);
      uiCallbacksShowNote('+৫০ স্বাস্থ্য (HP) পূরণ হয়েছে!');
    } else if (item.id === 'kevlar') {
      engine.player.addArmor(50);
      uiCallbacksShowNote('+৫০ বর্ম (Armor) যুক্ত হয়েছে!');
    } else if (item.id === 'ammo_resupply') {
      Object.keys(engine.weaponSystem.ammo).forEach(k => {
        engine.weaponSystem.ammo[k].reserve += engine.weaponSystem.weapons[k].magSize * 4;
      });
      engine.weaponSystem.grenades = 6;
      uiCallbacksShowNote('ফুল গোলাবারুদ ও গ্রেনেড সাপ্লাই হয়েছে!');
    } else if (item.id === 'shotgun_boost') {
      engine.weaponSystem.weapons.SHOTGUN.damage = Math.round(engine.weaponSystem.weapons.SHOTGUN.damage * 1.3);
      uiCallbacksShowNote('স্বাধীনতা-১২ শটগানের ড্যামেজ ৩০% বেড়েছে!');
    } else if (item.id === 'smg_drum') {
      engine.weaponSystem.weapons.SMG.magSize = 60;
      engine.weaponSystem.ammo.SMG.current = 60;
      uiCallbacksShowNote('বেঙ্গল ভাইপারের ম্যাগাজিন ৬০ রাউন্ড করা হয়েছে!');
    } else if (item.id === 'airstrike') {
      engine.handleCollectDrop('POWERUP_NUKE');
      uiCallbacksShowNote('জরুরি এয়ারস্ট্রাইক চালু হয়েছে!');
    }
  };

  const uiCallbacksShowNote = (text) => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Main Menu (Start Screen) */}
      {!gameStarted && (
        <MainMenu
          onStartGame={handleStartGame}
          onToggleWeather={handleToggleRain}
          isRainEnabled={isRainEnabled}
        />
      )}

      {/* In-Game Heads-Up Display (HUD) */}
      {gameStarted && !gameOverData && (
        <>
          <HUD
            stats={stats}
            hitmarkers={hitmarkers}
            notifications={notifications}
            waveBanner={waveBanner}
            onOpenShop={() => {
              if (gameEngineRef.current) gameEngineRef.current.toggleShop();
            }}
          />

          <TouchControls gameEngine={gameEngineRef.current} />

          {/* Shop Modal */}
          <ShopModal
            isOpen={isShopOpen}
            onClose={() => {
              setIsShopOpen(false);
              if (gameEngineRef.current) {
                gameEngineRef.current.isPaused = false;
                gameEngineRef.current.renderer.domElement.requestPointerLock();
              }
            }}
            takaCoins={stats ? stats.takaCoins : 0}
            onBuyItem={handleBuyItem}
          />

          {/* Pause Menu */}
          <PauseMenu
            isOpen={isPaused}
            onResume={handleResume}
            onRestart={handleRestart}
            isRainEnabled={isRainEnabled}
            onToggleRain={handleToggleRain}
          />
        </>
      )}

      {/* Game Over Screen */}
      {gameOverData && (
        <GameOverModal
          data={gameOverData}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
