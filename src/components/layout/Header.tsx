'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/profile', label: 'Profile' },
    { href: '/trends', label: 'Trends' },
    { href: '/planning', label: 'Planning' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/90 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-colored transition-all duration-300 group-hover:scale-110">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold gradient-text hidden sm:inline-block">
              Contentual
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  pathname === item.href
                    ? 'bg-contentual-pink/10 text-contentual-pink'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-contentual-pink'
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-contentual-pink rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                pathname === '/settings'
                  ? 'bg-contentual-pink/10 text-contentual-pink'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-contentual-pink'
              )}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-contentual-pink transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                  pathname === item.href
                    ? 'bg-contentual-pink/10 text-contentual-pink'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-contentual-pink'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
