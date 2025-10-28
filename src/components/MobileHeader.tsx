// src/components/MobileHeader.tsx
// REVISED VERSION - All navigation is localized

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedPath, isPublicRoute } from '../utils/languageRouting';

export const MobileHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  // Check if we're on a public route
  const isPublic = isPublicRoute(location.pathname);

  // ===================================================================
  // FIX: Localized navigation helper
  // ===================================================================
  const handleNavigate = (path: string) => {
    const localizedPath = isPublic ? getLocalizedPath(path, language) : path;
    console.log(`[MobileHeader] Navigating to: ${localizedPath} (language: ${language})`);
    navigate(localizedPath);
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <Link 
          to={isPublic ? getLocalizedPath('/', language) : '/'}
          className="text-xl font-bold text-white"
        >
          The Trading Diary
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 z-50 overflow-y-auto shadow-xl">
            <div className="p-6 space-y-6">
              {/* Navigation Links */}
              <nav className="space-y-2">
                <button
                  onClick={() => handleNavigate('/pricing')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.pricing', 'Pricing')}
                </button>

                <button
                  onClick={() => handleNavigate('/features')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.features', 'Features')}
                </button>

                <button
                  onClick={() => handleNavigate('/how-it-works')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.howItWorks', 'How it Works')}
                </button>

                <button
                  onClick={() => handleNavigate('/blog')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.blog', 'Blog')}
                </button>

                <button
                  onClick={() => handleNavigate('/contact')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.contact', 'Contact')}
                </button>

                <button
                  onClick={() => handleNavigate('/testimonials')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {t('navigation.testimonials', 'Testimonials')}
                </button>
              </nav>

              {/* Divider */}
              <div className="border-t border-gray-800" />

              {/* Auth Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigate('/auth')}
                  className="w-full px-4 py-3 text-white hover:bg-gray-800 rounded-lg transition-colors text-center"
                >
                  {t('navigation.signIn', 'Sign In')}
                </button>

                <button
                  onClick={() => handleNavigate('/auth')}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center font-medium"
                >
                  {t('navigation.getStarted', 'Get Started')}
                </button>
              </div>

              {/* Additional Links */}
              <div className="pt-4 border-t border-gray-800 space-y-2">
                <button
                  onClick={() => handleNavigate('/about')}
                  className="w-full text-left px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.about', 'About')}
                </button>

                <button
                  onClick={() => handleNavigate('/privacy')}
                  className="w-full text-left px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.privacy', 'Privacy Policy')}
                </button>

                <button
                  onClick={() => handleNavigate('/terms')}
                  className="w-full text-left px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('navigation.terms', 'Terms of Service')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
