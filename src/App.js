import React, { useState, useEffect, useRef, useCallback } from "react";
import { useResizeDetector } from "react-resize-detector";
import "./App.css";
import GameOver from "./Components/GameOver.js";

const App = () => {
  const { width, height, ref } = useResizeDetector();
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0);
  const [lasers, setLasers] = useState([]);
  const [shooting, setShooting] = useState(false);
  const [badge, setBadge] = useState(null);
  const [showCircle, setShowCircle] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pixelsShot, setPixelsShot] = useState(0);
  const [asteroids, setAsteroids] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const requestRef = useRef();
  const badgeTimeoutRef = useRef();
  const keys = useRef({});

  const handleKeyDown = useCallback(
    (e) => {
      keys.current[e.key] = true;
      if (gameOver && (e.key === " " || e.key === "Enter" || e.key === "r")) {
        window.location.reload();
      }
      if (e.key === " " && !shooting) {
        setShooting(true);
      }
    },
    [gameOver, shooting]
  );

  const handleKeyUp = useCallback((e) => {
    keys.current[e.key] = false;
    if (e.key === " ") {
      setShooting(false);
    }
  }, []);

  const checkCollision = (a, b, radius) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < radius;
  };

  const checkAsteroidCollision = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < 30;
  };

  useEffect(() => {
    if (gameOver) return;
    else {
      const asteroidInterval = setInterval(generateAsteroid, 3000);
      return () => clearInterval(asteroidInterval);
    }
  }, [width, height, gameOver]);

  useEffect(() => {
    if (gameOver) {
      setAsteroids([]);
    }
  }, [gameOver]);

  const generateAsteroid = () => {
    if (gameOver) return;

    let x, y;
    const border = Math.floor(Math.random() * 4);

    // Determine which border the asteroid will appear from
    if (border === 0) {
      // Top border
      x = Math.random() * (width || 300);
      y = 0;
    } else if (border === 1) {
      // Right border
      x = width || 300;
      y = Math.random() * (height || 300);
    } else if (border === 2) {
      // Bottom border
      x = Math.random() * (width || 300);
      y = height || 300;
    } else {
      // Left border
      x = 0;
      y = Math.random() * (height || 300);
    }

    const direction = Math.random() * 2 * Math.PI;
    setAsteroids((prevAsteroids) => [...prevAsteroids, { x, y, direction }]);
  };

  const createExplosion = (x, y) => {
    const particles = Array.from({ length: 20 }, () => ({
      x,
      y,
      direction: Math.random() * 2 * Math.PI,
      speed: Math.random() * 2,
      opacity: 1,
    }));

    setExplosions((prevExplosions) => [...prevExplosions, ...particles]);

    setTimeout(() => {
      setExplosions((prevExplosions) =>
        prevExplosions.filter((particle) => particle.opacity > 0)
      );
    }, 2000);
  };

  useEffect(() => {
    const updatePosition = () => {
      if (gameOver) return;

      if (keys.current["ArrowUp"]) {
        setVelocity((prevVelocity) => ({
          x: prevVelocity.x + Math.sin(direction) * 0.5,
          y: prevVelocity.y - Math.cos(direction) * 0.5,
        }));
      }
      if (keys.current["ArrowDown"]) {
        setVelocity((prevVelocity) => ({
          x: prevVelocity.x - Math.sin(direction) * 0.2,
          y: prevVelocity.y + Math.cos(direction) * 0.2,
        }));
      }
      if (keys.current["ArrowLeft"]) {
        setDirection((prevDirection) => prevDirection - 0.1);
      }
      if (keys.current["ArrowRight"]) {
        setDirection((prevDirection) => prevDirection + 0.1);
      }

      setPosition((prevPosition) => ({
        x: (prevPosition.x + velocity.x + (width || 300)) % (width || 300),
        y: (prevPosition.y + velocity.y + (height || 300)) % (height || 300),
      }));

      setVelocity((prevVelocity) => ({
        x: prevVelocity.x * 0.99,
        y: prevVelocity.y * 0.99,
      }));

      if (shooting) {
        setLasers((prevLasers) => [
          ...prevLasers,
          {
            x: position.x + Math.sin(direction) * 15,
            y: position.y - Math.cos(direction) * 15,
            direction: direction,
          },
        ]);
      }

      setLasers((prevLasers) =>
        prevLasers.map((laser) => {
          const newX =
            (laser.x + Math.sin(laser.direction) * 5 + (width || 300)) %
            (width || 300);
          const newY =
            (laser.y - Math.cos(laser.direction) * 5 + (height || 300)) %
            (height || 300);
          setPixelsShot(
            (prevPixelsShot) =>
              prevPixelsShot +
              Math.sqrt(
                Math.pow(newX - laser.x, 2) + Math.pow(newY - laser.y, 2)
              )
          );
          return {
            ...laser,
            x: newX,
            y: newY,
          };
        })
      );

      setExplosions((prevExplosions) =>
        prevExplosions.map((particle) => ({
          ...particle,
          x: particle.x + Math.sin(particle.direction) * particle.speed,
          y: particle.y - Math.cos(particle.direction) * particle.speed,
          opacity: particle.opacity - 0.01,
        }))
      );

      setAsteroids((prevAsteroids) => {
        const movedAsteroids = prevAsteroids.map((asteroid) => {
          const newX =
            (asteroid.x + Math.sin(asteroid.direction) * 1 + (width || 300)) %
            (width || 300);
          const newY =
            (asteroid.y - Math.cos(asteroid.direction) * 1 + (height || 300)) %
            (height || 300);
          return {
            ...asteroid,
            x: newX,
            y: newY,
          };
        });

        const newAsteroids = [];
        const destroyedAsteroids = new Set();
        for (let i = 0; i < movedAsteroids.length; i++) {
          for (let j = i + 1; j < movedAsteroids.length; j++) {
            if (checkAsteroidCollision(movedAsteroids[i], movedAsteroids[j])) {
              createExplosion(movedAsteroids[i].x, movedAsteroids[i].y);
              createExplosion(movedAsteroids[j].x, movedAsteroids[j].y);
              destroyedAsteroids.add(i);
              destroyedAsteroids.add(j);
            }
          }
          if (!destroyedAsteroids.has(i)) {
            newAsteroids.push(movedAsteroids[i]);
          }
        }
        return newAsteroids;
      });

      const newLasers = lasers.filter((laser) => {
        const hitAsteroidIndex = asteroids.findIndex((asteroid) =>
          checkCollision(laser, asteroid, 15)
        );
        if (hitAsteroidIndex !== -1) {
          const hitAsteroid = asteroids[hitAsteroidIndex];
          createExplosion(hitAsteroid.x, hitAsteroid.y);
          setAsteroids((prevAsteroids) =>
            prevAsteroids.filter((_, index) => index !== hitAsteroidIndex)
          );
          return false;
        }
        return true;
      });

      setLasers(newLasers);

      if (
        asteroids.some((asteroid) => checkCollision(asteroid, position, 20))
      ) {
        setGameOver(true);
        return;
      }

      if (badge && checkCollision(position, badge, 10)) {
        setBadge(null);
        setShowCircle(true);
        setTimeout(() => setShowCircle(false), 5000);
      }

      setExplosions((prevExplosions) =>
        prevExplosions.map((particle) => ({
          ...particle,
          x: particle.x + Math.sin(particle.direction) * particle.speed,
          y: particle.y - Math.cos(particle.direction) * particle.speed,
          opacity: particle.opacity - 0.01,
        }))
      );

      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, [
    velocity,
    width,
    height,
    position,
    direction,
    shooting,
    badge,
    lasers,
    gameOver,
    asteroids,
  ]);

  useEffect(() => {
    const asteroidInterval = setInterval(generateAsteroid, 3000);

    return () => clearInterval(asteroidInterval);
  }, [width, height]);

  useEffect(() => {
    const generateBadge = () => {
      if (!badge) {
        const x = Math.random() * (width || 300);
        const y = Math.random() * (height || 300);
        setBadge({ x, y });

        badgeTimeoutRef.current = setTimeout(() => {
          setBadge(null);
        }, 8000);
      }
    };

    const badgeInterval = setInterval(generateBadge, 5000);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      clearInterval(badgeInterval);
      clearTimeout(badgeTimeoutRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [badge, width, height, handleKeyDown, handleKeyUp]);

  return (
    <div className="game-container" ref={ref}>
      <svg width={width} height={height}>
        <polygon
          points="-10,10 10,10 0,-20"
          fill="white"
          transform={`translate(${position.x}, ${position.y}) rotate(${
            (direction * 180) / Math.PI
          })`}
        />
        {lasers.map((laser, index) => (
          <line
            key={index}
            x1={laser.x}
            y1={laser.y}
            x2={laser.x + Math.sin(laser.direction) * 5}
            y2={laser.y - Math.cos(laser.direction) * 5}
            stroke="white"
            strokeWidth="5"
          />
        ))}
        {badge && <circle cx={badge.x} cy={badge.y} r="10" fill="green" />}
        {showCircle && (
          <circle
            cx={position.x}
            cy={position.y}
            r="30"
            fill="none"
            stroke="green"
            strokeWidth="2"
          />
        )}
        {asteroids.map((asteroid, index) => (
          <circle
            key={index}
            cx={asteroid.x}
            cy={asteroid.y}
            r="15"
            fill="gray"
          />
        ))}
        {explosions.map((particle, index) => (
          <circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r="2"
            fill="yellow"
            opacity={particle.opacity}
          />
        ))}
        {gameOver && <GameOver />}
      </svg>
      <div className="counter">Pixels Shot: {Math.floor(pixelsShot)}</div>
    </div>
  );
};

export default App;
