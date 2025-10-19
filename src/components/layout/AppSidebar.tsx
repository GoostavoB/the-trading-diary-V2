import { BarChart3, Upload, TrendingUp, Settings, BookOpen, HelpCircle, LogOut, TrendingDown, Calendar, Scale, Wrench, Users, Brain, Trophy, Circle } from 'lucide-react';
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
  { title: 'Upload Trade', url: '/upload', icon: Upload },
  { title: 'Analytics', url: '/analytics', icon: TrendingUp },
  { title: 'Forecast', url: '/forecast', icon: TrendingUp },
  { title: 'Achievements', url: '/achievements', icon: Trophy },
  { title: 'Social', url: '/social', icon: Users },
  { title: 'AI Tools', url: '/ai-tools', icon: Brain },
  { title: 'Tools', url: '/tools', icon: Wrench },
  { title: 'Economic Calendar', url: '/economic-calendar', icon: Calendar },
  { title: 'BTC Long/Short Ratio', url: '/long-short-ratio', icon: Scale },
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
    <Sidebar collapsible="icon" className="border-r border-border/50 backdrop-blur-xl bg-card/50 glass">
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
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
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
                  const IconComponent = (LucideIcons as any)[item.icon] || Circle;
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

      <div className="p-2 border-t border-border">
        <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
