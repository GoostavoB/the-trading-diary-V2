import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Home, 
  Upload, 
  BarChart3, 
  Settings, 
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Search,
} from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  category: string;
  keywords: string[];
}

const searchItems: SearchItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View your trading overview',
    icon: Home,
    path: '/dashboard',
    category: 'Pages',
    keywords: ['home', 'overview', 'main', 'stats'],
  },
  {
    id: 'upload',
    title: 'Upload Trades',
    description: 'Add new trades to your journal',
    icon: Upload,
    path: '/upload',
    category: 'Pages',
    keywords: ['add', 'import', 'csv', 'new trade'],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Deep dive into your performance',
    icon: BarChart3,
    path: '/analytics',
    category: 'Pages',
    keywords: ['stats', 'charts', 'analysis', 'performance'],
  },
  {
    id: 'forecast',
    title: 'Forecast',
    description: 'Project future performance',
    icon: Target,
    path: '/forecast',
    category: 'Pages',
    keywords: ['prediction', 'projection', 'goals'],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure your account',
    icon: Settings,
    path: '/settings',
    category: 'Pages',
    keywords: ['preferences', 'config', 'account'],
  },
  {
    id: 'market-data',
    title: 'Market Data',
    description: 'View live market information',
    icon: TrendingUp,
    path: '/market-data',
    category: 'Tools',
    keywords: ['prices', 'crypto', 'live', 'btc', 'eth'],
  },
  {
    id: 'social',
    title: 'Social',
    description: 'Connect with other traders',
    icon: Users,
    path: '/social',
    category: 'Community',
    keywords: ['community', 'leaderboard', 'share'],
  },
  {
    id: 'fee-analysis',
    title: 'Fee Analysis',
    description: 'Analyze your trading costs',
    icon: DollarSign,
    path: '/fee-analysis',
    category: 'Tools',
    keywords: ['costs', 'fees', 'expenses'],
  },
];

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter results based on search
  const filteredItems = useMemo(() => {
    if (!search) return searchItems;

    const searchLower = search.toLowerCase();
    return searchItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.keywords.some((keyword) => keyword.includes(searchLower))
      );
    });
  }, [search]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch('');
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, features, tools..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedItems).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.path)}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>

      {/* Footer hint */}
      <div className="border-t border-border/50 p-2 text-xs text-muted-foreground text-center">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted">⌘K</kbd> or{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-muted">Ctrl+K</kbd> to toggle
      </div>
    </CommandDialog>
  );
};
