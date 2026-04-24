import React, { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glow' | 'neon' | 'gradient' | 'glass';

interface PremiumCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    title?: ReactNode;
    subtitle?: string;
    action?: ReactNode;
    glow?: boolean;
    variant?: CardVariant;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(({
    children,
    className,
    contentClassName,
    title,
    subtitle,
    action,
    glow = false,
    variant = 'default',
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                // Base
                "relative rounded-xl overflow-hidden transition-all duration-300 shimmer-hover gradient-border",
                // Default glass treatment
                "bg-card/70 backdrop-blur-xl",
                // Border
                "border border-white/8",
                // Hover
                "hover:border-white/14 hover:bg-card/85",

                // Variant overrides
                variant === 'glow' && [
                    "border-primary/20",
                    "shadow-[0_0_40px_-8px_hsl(36_100%_50%/0.2)]",
                    "hover:shadow-[0_0_60px_-6px_hsl(36_100%_50%/0.35)]",
                    "hover:border-primary/35"
                ],
                variant === 'neon' && [
                    "border-emerald-500/20",
                    "shadow-[0_0_30px_-8px_hsl(142_70%_50%/0.25)]",
                    "hover:shadow-[0_0_50px_-6px_hsl(142_70%_50%/0.4)]",
                    "hover:border-emerald-500/35"
                ],
                variant === 'gradient' && [
                    "bg-gradient-to-br from-primary/8 via-card/70 to-card/70",
                    "border-primary/15",
                    "hover:from-primary/12 hover:border-primary/25"
                ],
                variant === 'glass' && [
                    "bg-white/[0.03] backdrop-blur-2xl",
                    "border-white/10",
                    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
                    "hover:bg-white/[0.05]"
                ],

                // Legacy glow prop
                glow && variant === 'default' && [
                    "border-primary/20",
                    "shadow-[0_0_40px_-8px_hsl(36_100%_50%/0.2)]",
                    "hover:shadow-[0_0_60px_-6px_hsl(36_100%_50%/0.35)]",
                    "hover:border-primary/35"
                ],

                className
            )}
            {...props}
        >
            {/* Top edge highlight gradient line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent pointer-events-none z-10" />

            {/* Subtle inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

            {/* For glow/gradient variants: bottom ambient */}
            {(glow || variant === 'glow' || variant === 'gradient') && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
            )}

            {/* Header (Optional) */}
            {(title || action) && (
                <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-white/8 z-10">
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
            <div className={cn("relative p-4 z-10", contentClassName)}>
                {children}
            </div>
        </div>
    );
});

PremiumCard.displayName = 'PremiumCard';
