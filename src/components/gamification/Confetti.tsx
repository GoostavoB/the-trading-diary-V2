import { useEffect, useState } from 'react';

interface ConfettiProps {
    isActive?: boolean;
    duration?: number;
}

export const Confetti = ({ isActive = false, duration = 3000 }: ConfettiProps) => {
    const [show, setShow] = useState(isActive);

    useEffect(() => {
        if (isActive) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), duration);
            return () => clearTimeout(timer);
        }
    }, [isActive, duration]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {/* Placeholder confetti animation */}
            <div className="animate-fade-in text-center pt-20">
                🎉🎊🎉
            </div>
        </div>
    );
};
