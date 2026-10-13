// App.jsx - Main Application entry wiring Three.js engine and React HUD
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine.js';
import { HUD } from './components/HUD.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { ShopModal } from './components/ShopModal.jsx';
import { PauseMenu } from './components/PauseMenu.jsx';
import { GameOverModal } from './components/GameOverModal.jsx';
import { TouchControls } from './components/TouchControls.jsx';
import { PerkModal } from './components/PerkModal.jsx';

export default function App() {
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [stats, setStats] = useState(null);
  const [hitmarkers, setHitmarkers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [waveBanner, setWaveBanner] = useState({ show: false, wave: 1, message: '' });
  const [comboBanner, setComboBanner] = useState({ show: false, count: 0, title: '' });
  const [isLightningFlashing, setIsLightningFlashing] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [isRainEnabled, setIsRainEnabled] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState('high');
  const [perkModalState, setPerkModalState] = useState({ isOpen: false, wave: 1 });

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
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = -30 - Math.random() * 20;
        setHitmarkers(prev => [...prev, { id, damage, isHeadshot, offsetX, offsetY }]);
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
      showCombo: (count, title) => {
        setComboBanner({ show: true, count, title });
        setTimeout(() => {
          setComboBanner(prev => ({ ...prev, show: false }));
        }, 2200);
      },
      triggerScreenLightning: () => {
        setIsLightningFlashing(true);
        setTimeout(() => {
          setIsLightningFlashing(false);
        }, 140);
      },
      onPauseChange: (paused) => {
        setIsPaused(paused);
      },
      onShopToggle: (open) => {
        setIsShopOpen(open);
      },
      onWaveComplete: (wave) => {
        setPerkModalState({ isOpen: true, wave });
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
      engine.setGraphicsQuality(graphicsQuality);
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

  const handleSetGraphicsQuality = (preset) => {
    setGraphicsQuality(preset);
    if (gameEngineRef.current) {
      gameEngineRef.current.setGraphicsQuality(preset);
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
    } else if (item.id === 'rocket_ammo') {
      engine.weaponSystem.ammo.ROCKET.reserve += 4;
      uiCallbacksShowNote('মেঘনা-আরপিজি রকেট +৪ রাউন্ড যুক্ত হয়েছে!');
    } else if (item.id === 'airstrike') {
      engine.handleCollectDrop('POWERUP_NUKE');
      uiCallbacksShowNote('জরুরি এয়ারস্ট্রাইক চালু হয়েছে!');
    }
  };

  const handleSelectPerk = (perk) => {
    const engine = gameEngineRef.current;
    if (engine) {
      if (perk.id === 'speed_boost') engine.player.moveSpeedMult *= 1.25;
      if (perk.id === 'juggernaut') {
        engine.player.maxHealth += 35;
        engine.player.health = engine.player.maxHealth;
      }
      if (perk.id === 'rapid_fire') {
        Object.values(engine.weaponSystem.weapons).forEach(w => {
          w.fireRate *= 0.7;
        });
      }
      if (perk.id === 'vampire') engine.player.vampireLifesteal += 4;
      if (perk.id === 'electric') engine.player.electricAmmo = true;
      if (perk.id === 'grenadier') engine.weaponSystem.grenades += 2;

      uiCallbacksShowNote(`পারক সক্রিয়: ${perk.name}`);
      engine.startNextWave();
    }
    setPerkModalState({ isOpen: false, wave: perkModalState.wave });
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

  const handleTouchAction = useCallback((action, payload) => {
    const engine = gameEngineRef.current;
    if (!engine) return;
    if (action === 'move') {
      if (payload.dir === 'forward') engine.input.moveForward = payload.active;
      if (payload.dir === 'backward') engine.input.moveBackward = payload.active;
      if (payload.dir === 'left') engine.input.moveLeft = payload.active;
      if (payload.dir === 'right') engine.input.moveRight = payload.active;
    } else if (action === 'shoot') {
      engine.input.isShooting = payload.active;
      if (payload.active) engine.fireActiveWeapon();
    } else if (action === 'jump') {
      engine.input.jump = payload.active;
    } else if (action === 'reload') {
      if (engine.weaponSystem) engine.weaponSystem.reload();
    } else if (action === 'grenade') {
      if (engine.weaponSystem && engine.player) {
        engine.camera.getWorldDirection(engine._cameraDirection);
        engine.weaponSystem.throwGrenade(engine.player.position, engine._cameraDirection, engine.world);
      }
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Monsoon Lightning Screen Flash */}
      {isLightningFlashing && (
        <div className="absolute inset-0 bg-white/70 pointer-events-none z-40 transition-opacity duration-150 animate-pulse" />
      )}

      {/* Main Menu (Start Screen) */}
      {!gameStarted && (
        <MainMenu
          onStartGame={handleStartGame}
          onToggleWeather={handleToggleRain}
          isRainEnabled={isRainEnabled}
          graphicsQuality={graphicsQuality}
          onSetGraphicsQuality={handleSetGraphicsQuality}
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
            comboBanner={comboBanner}
            onOpenShop={() => {
              if (gameEngineRef.current) gameEngineRef.current.toggleShop();
            }}
          />

          <TouchControls onAction={handleTouchAction} />

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
            graphicsQuality={graphicsQuality}
            onSetGraphicsQuality={handleSetGraphicsQuality}
          />


          {/* Roguelite Wave-completion Perk Modal */}
          <PerkModal
            isOpen={perkModalState.isOpen}
            wave={perkModalState.wave}
            onSelectPerk={handleSelectPerk}
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
