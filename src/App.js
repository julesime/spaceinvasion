import React, { useState, useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import "./App.css";

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

  const handleKeyDown = (e) => {
    keys.current[e.key] = true;
    if (gameOver && (e.key === " " || e.key === "Enter" || e.key === "r")) {
      window.location.reload();
    }
  };

  const handleKeyUp = (e) => {
    keys.current[e.key] = false;
    if (e.key === " ") {
      setShooting(false);
    }
  };

  const checkCollision = (laser) => {
    const dx = laser.x - position.x;
    const dy = laser.y - position.y;
    return Math.sqrt(dx * dx + dy * dy) < 10;
  };

  const generateAsteroid = () => {
    const x = Math.random() * (width || 300);
    const y = Math.random() * (height || 300);
    const direction = Math.random() * 2 * Math.PI; // Random direction
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
          x: prevVelocity.x - Math.sin(direction) * 0.5,
          y: prevVelocity.y + Math.cos(direction) * 0.5,
        }));
      }
      if (keys.current["ArrowLeft"]) {
        setDirection((prevDirection) => prevDirection - 0.1);
      }
      if (keys.current["ArrowRight"]) {
        setDirection((prevDirection) => prevDirection + 0.1);
      }
      if (keys.current[" "]) {
        setShooting(true);
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
          const newX = (laser.x + Math.sin(laser.direction) * 5 + (width || 300)) % (width || 300);
          const newY = (laser.y - Math.cos(laser.direction) * 5 + (height || 300)) % (height || 300);
          if (shooting) {
            setPixelsShot((prevPixelsShot) => prevPixelsShot + Math.sqrt(Math.pow(newX - laser.x, 2) + Math.pow(newY - laser.y, 2)));
          }
          return {
            ...laser,
            x: newX,
            y: newY,
          };
        })
      );
  
      setAsteroids((prevAsteroids) =>
        prevAsteroids.map((asteroid) => {
          const newX = (asteroid.x + Math.sin(asteroid.direction) * 1 + (width || 300)) % (width || 300);
          const newY = (asteroid.y - Math.cos(asteroid.direction) * 1 + (height || 300)) % (height || 300);
          return {
            ...asteroid,
            x: newX,
            y: newY,
          };
        })
      );
  
      if (asteroids.some((asteroid) => Math.sqrt(Math.pow(asteroid.x - position.x, 2) + Math.pow(asteroid.y - position.y, 2)) < 20)) {
        setGameOver(true);
        return;
      }
  
      if (lasers.some(checkCollision)) {
        setGameOver(true);
        return;
      }
  
      if (badge && position.x >= badge.x - 10 && position.x <= badge.x + 10 && position.y >= badge.y - 10 && position.y <= badge.y + 10) {
        setBadge(null);
        setShowCircle(true);
        setTimeout(() => setShowCircle(false), 5000);
      }
  
      requestRef.current = requestAnimationFrame(updatePosition);
    };
  
    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, [velocity, width, height, position, direction, shooting, badge, lasers, gameOver, asteroids]);
  
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
  }, [badge, width, height, gameOver, handleKeyDown, handleKeyUp]);

  return (
    <div className="game-container" ref={ref}>
      <svg width={width} height={height}>
        <polygon
          points="-10,10 10,10 0,-20"
          fill="black"
          transform={`translate(${position.x}, ${position.y}) rotate(${(direction * 180) / Math.PI})`}
        />
        {lasers.map((laser, index) => (
          <line
            key={index}
            x1={laser.x}
            y1={laser.y}
            x2={laser.x + Math.sin(laser.direction) * 5}
            y2={laser.y - Math.cos(laser.direction) * 5}
            stroke="black"
            strokeWidth="1"
          />
        ))}
        {badge && (
          <circle cx={badge.x} cy={badge.y} r="10" fill="green" />
        )}
        {showCircle && (
          <circle
            cx={position.x}
            cy={position.y}
            r="20"
            fill="none"
            stroke="green"
            strokeWidth="2"
          />
        )}
        {asteroids.map((asteroid, index) => (
          <circle key={index} cx={asteroid.x} cy={asteroid.y} r="15" fill="gray" />
        ))}
        {gameOver && (
          <text x="50%" y="50%" textAnchor="middle" stroke="red" strokeWidth="2px" dy=".3em" fontSize="30">
            GAME OVER
          </text>
        )}
      </svg>
      <div className="counter">
        Pixels Shot: {Math.floor(pixelsShot)}
      </div>
    </div>
  );
  
};

export default App;
