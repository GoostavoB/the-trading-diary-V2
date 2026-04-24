import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    title?: ReactNode;
    subtitle?: string;
    action?: ReactNode;
    glow?: boolean;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(({
    children,
    className,
    contentClassName,
    title,
    subtitle,
    action,
    glow = false,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative rounded-xl overflow-hidden transition-all duration-300",
                "bg-card/70 backdrop-blur-xl border border-white/8",
                "hover:border-primary/25 hover:bg-card/85",
                glow && "shadow-[0_0_40px_-8px_rgba(255,153,0,0.15)]",
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Overlay — top edge highlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Header (Optional) */}
            {(title || action) && (
                <div className="relative flex items-center justify-between p-4 border-b border-white/8">
                    <div>
                        {title && (
                            <div className="text-sm font-semibold text-foreground tracking-tight">
                                {title}
                            </div>
                        )}
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {action && (
                        <div className="flex items-center gap-2">
                            {action}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={cn("relative p-4", contentClassName)}>
                {children}
            </div>
        </div>
    );
});

PremiumCard.displayName = 'PremiumCard';
