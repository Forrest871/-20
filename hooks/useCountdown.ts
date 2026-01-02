import { useState, useEffect } from 'react';

export const useCountdown = (initialSeconds: number) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return { timeLeft, isFinished };
};