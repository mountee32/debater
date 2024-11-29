import { useState, useEffect } from 'react';

export const useTimer = (initialTime: number, onTimeEnd: () => Promise<void>) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (isEnding) return; // Don't continue countdown if game is ending

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsEnding(true);
          onTimeEnd().finally(() => {
            setTimeLeft(0);
          });
          return 1; // Keep at 1 until end operation completes
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeEnd, isEnding]);

  return { timeLeft, isEnding };
};
