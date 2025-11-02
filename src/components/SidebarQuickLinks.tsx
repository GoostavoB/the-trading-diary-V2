import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { BarChart3, TrendingUp, Target, Sparkles, Image } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export function SidebarQuickLinks() {
  const { t } = useTranslation();
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-accent text-accent-foreground font-medium"
      : "hover:bg-accent/50 hover:text-accent-foreground";

  const quickLinks = [
    { to: '/analytics', icon: BarChart3, label: t('navigation.analytics') },
    { to: '/forecast', icon: TrendingUp, label: t('navigation.forecast') },
    { to: '/achievements', icon: Target, label: t('navigation.achievements') },
    { to: '/ai-tools', icon: Sparkles, label: t('navigation.aiTools') },
    { to: '/blog', icon: Image, label: t('navigation.blog', 'Blog') },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('navigation.quickAccess')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {quickLinks.map((link) => (
            <SidebarMenuItem key={link.to}>
              <SidebarMenuButton asChild tooltip={link.label}>
                <NavLink to={link.to} end className={getNavCls}>
                  <link.icon className="mr-2 h-4 w-4" />
                  <span>{link.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
