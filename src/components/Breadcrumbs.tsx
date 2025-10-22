import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/') return null;
  
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('nav.home') || 'Home', path: '/' }
  ];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip language codes in breadcrumbs
    if (['en', 'pt', 'es', 'ar', 'vi'].includes(segment)) {
      return;
    }
    
    // Format label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Use translations for known routes
    const routeTranslations: Record<string, string> = {
      'blog': t('nav.blog') || 'Blog',
      'dashboard': t('nav.dashboard') || 'Dashboard',
      'upload': 'Upload',
      'analytics': 'Analytics',
      'settings': 'Settings',
      'tools': 'Tools',
      'auth': 'Sign In',
      'author': 'Author'
    };
    
    if (routeTranslations[segment]) {
      label = routeTranslations[segment];
    }
    
    breadcrumbs.push({ label, path: currentPath });
  });
  
  return (
    <nav 
      className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={crumb.path} className="flex items-center gap-2">
            {index === 0 && <Home className="w-4 h-4" />}
            
            {isLast ? (
              <span className="text-foreground font-medium" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link 
                  to={crumb.path} 
                  className="hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};
