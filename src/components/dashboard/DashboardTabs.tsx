import { memo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, LayoutDashboard, LineChart, History, GripVertical, Brain, Wrench, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface DashboardTab {
    id: string;
    title: string;
    type: 'trade-station' | 'main' | 'behavior' | 'insights' | 'trade-history' | 'custom';
    isRemovable?: boolean;
}

interface DashboardTabsProps {
    tabs: DashboardTab[];
    activeTabId: string;
    onTabChange: (id: string) => void;
    onTabsReorder: (tabs: DashboardTab[]) => void;
    onAddTab: () => void;
    onRemoveTab: (id: string) => void;
}

export const DashboardTabs = memo(({
    tabs,
    activeTabId,
    onTabChange,
    onTabsReorder,
    onAddTab,
    onRemoveTab,
}: DashboardTabsProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
            const newIndex = tabs.findIndex((tab) => tab.id === over.id);
            onTabsReorder(arrayMove(tabs, oldIndex, newIndex));
        }
    };

    return (
        <div className="flex items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 pt-2 sticky top-0 z-50 overflow-x-auto no-scrollbar">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={tabs.map(t => t.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => (
                            <SortableTab
                                key={tab.id}
                                tab={tab}
                                isActive={tab.id === activeTabId}
                                onClick={() => onTabChange(tab.id)}
                                onRemove={() => onRemoveTab(tab.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg ml-1 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                onClick={onAddTab}
                disabled={tabs.filter(t => t.type === 'custom').length >= 2}
                title={tabs.filter(t => t.type === 'custom').length >= 2 ? "Max 2 custom dashboards" : "New Dashboard"}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
});

DashboardTabs.displayName = 'DashboardTabs';

interface SortableTabProps {
    tab: DashboardTab;
    isActive: boolean;
    onClick: () => void;
    onRemove: () => void;
}

const SortableTab = ({ tab, isActive, onClick, onRemove }: SortableTabProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const getIcon = () => {
        switch (tab.type) {
            case 'trade-station': return <Wrench className="h-3.5 w-3.5" />;
            case 'main': return <LayoutDashboard className="h-3.5 w-3.5" />;
            case 'behavior': return <Brain className="h-3.5 w-3.5" />;
            case 'insights': return <Lightbulb className="h-3.5 w-3.5" />;
            case 'trade-history': return <History className="h-3.5 w-3.5" />;
            default: return null;
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    ref={setNodeRef}
                    style={style}
                    className={cn(
                        "group relative flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer select-none transition-all duration-200 border-t border-x border-transparent min-w-[120px] max-w-[200px]",
                        isActive
                            ? "bg-background border-border/40 text-foreground shadow-sm font-medium"
                            : "hover:bg-accent/30 text-muted-foreground hover:text-foreground",
                        isDragging && "opacity-50"
                    )}
                    onClick={onClick}
                >
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent"
                    >
                        <GripVertical className="h-3 w-3" />
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getIcon()}
                        <span className="truncate text-sm">{tab.title}</span>
                    </div>

                    {tab.isRemovable && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-opacity"
                        >
                            <X className="h-3 w-3" />
                        </div>
                    )}

                    {/* Active Indicator Line */}
                    {isActive && (
                        <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary z-10" />
                    )}
                </div>
            </ContextMenuTrigger>
            {tab.isRemovable && (
                <ContextMenuContent>
                    <ContextMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                        <X className="mr-2 h-4 w-4" />
                        Close Tab
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
};
