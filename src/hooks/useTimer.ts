import { useState, useEffect } from 'react';

export const useTimer = (initialTime: number, onTimeEnd: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeEnd]);

  return timeLeft;
};
