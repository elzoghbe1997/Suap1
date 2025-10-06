import React from 'react';

// Easing function for a smooth, decelerating animation curve
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * A custom React hook that animates a number from a previous value to a new end value.
 * @param endValue The target number to animate to.
 * @param duration The duration of the animation in milliseconds.
 * @returns The current animated value.
 */
export const useAnimatedCounter = (endValue: number, duration: number = 800) => {
    const [count, setCount] = React.useState(endValue);
    const valueRef = React.useRef(endValue);

    React.useEffect(() => {
        const startValue = valueRef.current;
        // No need to animate if value hasn't changed
        if (startValue === endValue) {
             setCount(endValue);
             return;
        }

        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const t = Math.min(progress / duration, 1);
            const easedT = easeOutExpo(t);
            
            const currentValue = startValue + (endValue - startValue) * easedT;
            setCount(currentValue);

            if (progress < duration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                valueRef.current = endValue;
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
            valueRef.current = endValue;
        };
    }, [endValue, duration]);

    return count;
};
