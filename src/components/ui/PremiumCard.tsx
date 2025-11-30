import React, { ReactNode } from 'react';
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

export function PremiumCard({
    children,
    className,
    contentClassName,
    title,
    subtitle,
    action,
    glow = false,
    ...props
}: PremiumCardProps) {
    return (
        <div
            className={cn(
                "relative rounded-xl overflow-hidden transition-all duration-300",
                "bg-card/40 backdrop-blur-xl border border-white/5",
                "hover:border-primary/20 hover:bg-card/60",
                glow && "shadow-[0_0_30px_-10px_rgba(255,153,0,0.1)]",
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Header (Optional) */}
            {(title || action) && (
                <div className="relative flex items-center justify-between p-4 border-b border-white/5">
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
}
