import { describe, it, expect } from 'vitest';
import {
    isWithinBounds,
    doWidgetsOverlap,
    hasCollision,
    findNearestValidPosition,
    validateLayout,
    isValidSwap,
    toGridWidget,
    type GridWidget,
} from './gridValidator';
import type { WidgetSize } from '@/types/widget';

describe('gridValidator', () => {
    describe('isWithinBounds', () => {
        it('should return true for widget within bounds', () => {
            const widget: GridWidget = { id: 'test', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            expect(isWithinBounds(widget, 6)).toBe(true);
        });

        it('should return false for widget exceeding column bounds', () => {
            const widget: GridWidget = { id: 'test', column: 5, row: 0, size: 'medium' as WidgetSize, height: 2 };
            expect(isWithinBounds(widget, 6)).toBe(false);
        });

        it('should return false for widget with negative column', () => {
            const widget: GridWidget = { id: 'test', column: -1, row: 0, size: 'small' as WidgetSize, height: 2 };
            expect(isWithinBounds(widget, 6)).toBe(false);
        });

        it('should return false for widget with negative row', () => {
            const widget: GridWidget = { id: 'test', column: 0, row: -1, size: 'small' as WidgetSize, height: 2 };
            expect(isWithinBounds(widget, 6)).toBe(false);
        });
    });

    describe('doWidgetsOverlap', () => {
        it('should return false for non-overlapping widgets', () => {
            const widget1: GridWidget = { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            const widget2: GridWidget = { id: 'w2', column: 2, row: 0, size: 'small' as WidgetSize, height: 2 };
            expect(doWidgetsOverlap(widget1, widget2)).toBe(false);
        });

        it('should return true for overlapping widgets', () => {
            const widget1: GridWidget = { id: 'w1', column: 0, row: 0, size: 'medium' as WidgetSize, height: 2 };
            const widget2: GridWidget = { id: 'w2', column: 1, row: 0, size: 'medium' as WidgetSize, height: 2 };
            expect(doWidgetsOverlap(widget1, widget2)).toBe(true);
        });

        it('should return false for widgets in different rows', () => {
            const widget1: GridWidget = { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            const widget2: GridWidget = { id: 'w2', column: 0, row: 2, size: 'small' as WidgetSize, height: 2 };
            expect(doWidgetsOverlap(widget1, widget2)).toBe(false);
        });
    });

    describe('hasCollision', () => {
        const existingWidgets: GridWidget[] = [
            { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 },
            { id: 'w2', column: 1, row: 0, size: 'small' as WidgetSize, height: 2 },
        ];

        it('should return false when no collision', () => {
            const newWidget: GridWidget = { id: 'w3', column: 2, row: 0, size: 'small' as WidgetSize, height: 2 };
            expect(hasCollision(newWidget, existingWidgets)).toBe(false);
        });

        it('should return true when collision exists', () => {
            const newWidget: GridWidget = { id: 'w3', column: 0, row: 0, size: 'medium' as WidgetSize, height: 2 };
            expect(hasCollision(newWidget, existingWidgets)).toBe(true);
        });

        it('should exclude widget by ID', () => {
            const newWidget: GridWidget = { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            expect(hasCollision(newWidget, existingWidgets, 'w1')).toBe(false);
        });
    });

    describe('findNearestValidPosition', () => {
        const existingWidgets: GridWidget[] = [
            { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 },
            { id: 'w2', column: 1, row: 0, size: 'small' as WidgetSize, height: 2 },
        ];

        it('should return target position if valid', () => {
            const widget: GridWidget = { id: 'w3', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            const result = findNearestValidPosition(widget, 2, 0, existingWidgets, 6);
            expect(result).toEqual({ column: 2, row: 0 });
        });

        it('should find nearest valid position', () => {
            const widget: GridWidget = { id: 'w3', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            const result = findNearestValidPosition(widget, 0, 0, existingWidgets, 6);
            expect(result).toBeTruthy();
        });

        it('should return null if no valid position found', () => {
            const widget: GridWidget = { id: 'w3', column: 0, row: 0, size: 'large' as WidgetSize, height: 2 };
            const fullGrid: GridWidget[] = [
                { id: 'w1', column: 0, row: 0, size: 'large' as WidgetSize, height: 2 },
                { id: 'w2', column: 0, row: 1, size: 'large' as WidgetSize, height: 2 },
                { id: 'w3', column: 0, row: 2, size: 'large' as WidgetSize, height: 2 },
                { id: 'w4', column: 0, row: 3, size: 'large' as WidgetSize, height: 2 },
                { id: 'w5', column: 0, row: 4, size: 'large' as WidgetSize, height: 2 },
                { id: 'w6', column: 0, row: 5, size: 'large' as WidgetSize, height: 2 },
                { id: 'w7', column: 0, row: 6, size: 'large' as WidgetSize, height: 2 },
                { id: 'w8', column: 0, row: 7, size: 'large' as WidgetSize, height: 2 },
            ];
            const result = findNearestValidPosition(widget, 0, 0, fullGrid, 6);
            expect(result).toBeNull();
        });
    });

    describe('validateLayout', () => {
        it('should validate correct layout', () => {
            const widgets: GridWidget[] = [
                { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 },
                { id: 'w2', column: 1, row: 0, size: 'small' as WidgetSize, height: 2 },
                { id: 'w3', column: 2, row: 0, size: 'small' as WidgetSize, height: 2 },
            ];
            const result = validateLayout(widgets, 6);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect overlaps', () => {
            const widgets: GridWidget[] = [
                { id: 'w1', column: 0, row: 0, size: 'medium' as WidgetSize, height: 2 },
                { id: 'w2', column: 1, row: 0, size: 'medium' as WidgetSize, height: 2 },
            ];
            const result = validateLayout(widgets, 6);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should detect out of bounds widgets', () => {
            const widgets: GridWidget[] = [
                { id: 'w1', column: 5, row: 0, size: 'medium' as WidgetSize, height: 2 },
            ];
            const result = validateLayout(widgets, 6);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('isValidSwap', () => {
        const allWidgets: GridWidget[] = [
            { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 },
            { id: 'w2', column: 1, row: 0, size: 'small' as WidgetSize, height: 2 },
            { id: 'w3', column: 2, row: 0, size: 'small' as WidgetSize, height: 2 },
        ];

        it('should allow valid swap', () => {
            const widget1 = allWidgets[0];
            const widget2 = allWidgets[1];
            expect(isValidSwap(widget1, widget2, allWidgets, 6)).toBe(true);
        });

        it('should reject swap that causes out of bounds', () => {
            const widget1: GridWidget = { id: 'w1', column: 0, row: 0, size: 'small' as WidgetSize, height: 2 };
            const widget2: GridWidget = { id: 'w2', column: 5, row: 0, size: 'medium' as WidgetSize, height: 2 };
            const widgets = [widget1, widget2];
            expect(isValidSwap(widget1, widget2, widgets, 6)).toBe(false);
        });
    });

    describe('toGridWidget', () => {
        it('should convert WidgetPosition to GridWidget', () => {
            const position = { id: 'test', column: 0, row: 0, size: 'medium' as WidgetSize, height: 2 as 2 | 4 | 6 };
            const result = toGridWidget(position);
            expect(result).toEqual({
                id: 'test',
                column: 0,
                row: 0,
                size: 'medium',
                height: 2,
            });
        });
    });
});