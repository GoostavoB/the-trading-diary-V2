import { BarChart3, Upload, TrendingUp, TrendingDown, Target, Users, Brain, Trophy, Settings, BookOpen, HelpCircle, LineChart, LogOut, Circle, Star, PieChart, Activity, Zap, Sparkles, DollarSign } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCryptoWidget } from '@/components/SidebarCryptoWidget';
import { MenuCustomizationDialog } from '@/components/menu/MenuCustomizationDialog';
import { supabase } from '@/integrations/supabase/client';

const mainItems = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'Add Trade', url: '/upload', icon: Upload },
  { title: 'Analytics', url: '/analytics', icon: TrendingUp },
  { title: 'Market Data', url: '/market-data', icon: LineChart },
  { title: 'Forecast & Goals', url: '/forecast', icon: Target },
  { title: 'Community', url: '/social', icon: Users },
  { title: 'AI Assistant', url: '/ai-tools', icon: Brain },
  { title: 'Achievements', url: '/achievements', icon: Trophy },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const resourceItems = [
  { title: 'Blog', url: '/blog', icon: BookOpen },
  { title: 'FAQ', url: '/faq', icon: HelpCircle },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const [customMenuItems, setCustomMenuItems] = useState<any[]>([]);

  useEffect(() => {
    loadCustomMenuItems();
  }, []);

  const loadCustomMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_menu_items')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setCustomMenuItems(data || []);
    } catch (error) {
      console.error('Error loading custom menu items:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-muted text-foreground font-medium'
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 backdrop-blur-xl bg-[#0f0f11] glass z-40">
      <div className="p-4 border-b border-border/50 flex items-center justify-center">
        {open && <span className="font-bold text-lg">The Trading Diary</span>}
        {!open && <span className="font-bold text-xs">TTD</span>}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Learn</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Custom Menu Items */}
        {customMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Custom</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {customMenuItems.map((item) => {
                  const iconMap: Record<string, any> = {
                    Circle, Star, TrendingUp, TrendingDown, BarChart3, 
                    PieChart, Activity, Target, Zap, Sparkles, LineChart, DollarSign,
                    ...LucideIcons
                  };
                  const IconComponent = iconMap[item.icon] || Circle;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink to={item.route} end className={getNavCls}>
                          <IconComponent className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menu Customization */}
        <SidebarGroup>
          <SidebarGroupContent>
            <MenuCustomizationDialog />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Crypto Prices Widget */}
        <div className="mt-auto border-t border-border/50">
          <SidebarCryptoWidget />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Logout" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
