import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useResizeDetector } from 'react-resize-detector';
import { Html } from '@react-three/drei';
import { ConeGeometry, CylinderGeometry, RingGeometry, SphereGeometry } from 'three';
import './App.css';

// Extend the geometries to be available in the Three.js namespace
extend({ ConeGeometry, CylinderGeometry, RingGeometry, SphereGeometry });

const Triangle = ({ position, rotation }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry attach="geometry" args={[1, 2, 3]} />
      <meshStandardMaterial attach="material" color="black" />
    </mesh>
  );
};

const Laser = ({ position }) => {
  return (
    <mesh position={position}>
      <cylinderGeometry attach="geometry" args={[0.05, 0.05, 2, 32]} />
      <meshStandardMaterial attach="material" color="red" />
    </mesh>
  );
};

const Badge = ({ position }) => {
  return (
    <mesh position={position}>
      <sphereGeometry attach="geometry" args={[1, 32, 32]} />
      <meshStandardMaterial attach="material" color="green" />
    </mesh>
  );
};

const GameOverText = () => (
  <Html center>
    <div style={{ color: 'red', fontSize: '30px', fontWeight: 'bold' }}>GAME OVER</div>
  </Html>
);

const Game = () => {
  const { width, height, ref } = useResizeDetector();
  const [position, setPosition] = useState([0, 0, 0]);
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const [direction, setDirection] = useState(0);
  const [lasers, setLasers] = useState([]);
  const [shooting, setShooting] = useState(false);
  const [badge, setBadge] = useState(null);
  const [showCircle, setShowCircle] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pixelsShot, setPixelsShot] = useState(0);
  const requestRef = useRef();
  const badgeTimeoutRef = useRef();
  const keys = useRef({});

  const handleKeyDown = useCallback((e) => {
    keys.current[e.key] = true;
    if (gameOver && (e.key === " " || e.key === "Enter")) {
      window.location.reload();
    }
  }, [gameOver]);

  const handleKeyUp = useCallback((e) => {
    keys.current[e.key] = false;
    if (e.key === " ") {
      setShooting(false);
    }
  }, []);

  const checkCollision = useCallback((laser) => {
    const dx = laser.position[0] - position[0];
    const dy = laser.position[1] - position[1];
    return Math.sqrt(dx * dx + dy * dy) < 1;
  }, [position]);

  useEffect(() => {
    const updatePosition = () => {
      if (gameOver) return;

      let newVelocity = [...velocity];

      if (keys.current["ArrowUp"]) {
        newVelocity[0] += Math.sin(direction) * 0.05;
        newVelocity[1] -= Math.cos(direction) * 0.05;
      }
      if (keys.current["ArrowDown"]) {
        newVelocity[0] -= Math.sin(direction) * 0.05;
        newVelocity[1] += Math.cos(direction) * 0.05;
      }
      if (keys.current["ArrowLeft"]) {
        setDirection((prevDirection) => prevDirection - 0.05);
      }
      if (keys.current["ArrowRight"]) {
        setDirection((prevDirection) => prevDirection + 0.05);
      }
      if (keys.current[" "]) {
        setShooting(true);
      }

      const newPosition = [
        (position[0] + newVelocity[0]) % (width || 300),
        (position[1] + newVelocity[1]) % (height || 300),
        0,
      ];

      setPosition(newPosition);
      setVelocity(newVelocity.map(v => v * 0.99));

      if (shooting) {
        setLasers((prevLasers) => [
          ...prevLasers,
          {
            position: [
              newPosition[0] + Math.sin(direction) * 1.5,
              newPosition[1] - Math.cos(direction) * 1.5,
              0
            ],
            direction
          },
        ]);
      }

      setLasers((prevLasers) =>
        prevLasers.map((laser) => {
          const newX = (laser.position[0] + Math.sin(laser.direction) * 0.5) % (width || 300);
          const newY = (laser.position[1] - Math.cos(laser.direction) * 0.5) % (height || 300);
          if (shooting) {
            setPixelsShot((prevPixelsShot) => prevPixelsShot + Math.sqrt(Math.pow(newX - laser.position[0], 2) + Math.pow(newY - laser.position[1], 2)));
          }
          return {
            ...laser,
            position: [newX, newY, 0],
          };
        })
      );

      if (lasers.some(checkCollision)) {
        setGameOver(true);
        return;
      }

      if (badge && position[0] >= badge.position[0] - 1 && position[0] <= badge.position[0] + 1 && position[1] >= badge.position[1] - 1 && position[1] <= badge.position[1] + 1) {
        setBadge(null);
        setShowCircle(true);
        setTimeout(() => setShowCircle(false), 5000);
      }

      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, [velocity, width, height, position, direction, shooting, badge, lasers, gameOver, checkCollision]);

  useEffect(() => {
    const generateBadge = () => {
      if (!badge) {
        const x = Math.random() * (width || 300);
        const y = Math.random() * (height || 300);
        setBadge({ position: [x, y, 0] });

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
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Triangle position={position} rotation={[0, 0, direction]} />
        {lasers.map((laser, index) => (
          <Laser key={index} position={laser.position} />
        ))}
        {badge && (
          <Badge position={badge.position} />
        )}
        {showCircle && (
          <mesh position={position}>
            <ringGeometry attach="geometry" args={[1.8, 2, 32]} />
            <meshStandardMaterial attach="material" color="blue" />
          </mesh>
        )}
        {gameOver && <GameOverText />}
      </Canvas>
      <div className="counter">
        Pixels Shot: {Math.floor(pixelsShot)}
      </div>
    </div>
  );
};

export default Game;
