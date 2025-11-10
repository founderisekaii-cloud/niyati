
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Loader2,
  Languages,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NiyatiVerseLogo } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAdmin } from '@/hooks/useAdmin';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const navLinks = [
    { href: '/chapters', label: t('nav_chapters') },
    { href: '/about', label: t('nav_about') },
    { href: '/lore', label: t('nav_lore') },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <NiyatiVerseLogo className="h-6 w-6" />
            <span className="font-bold font-headline text-lg">NiyatiVerse</span>
          </Link>
          <nav className="hidden gap-6 text-sm md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname?.startsWith(link.href)
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname?.startsWith('/dashboard')
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                {t('nav_dashboard')}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={language}
                onValueChange={value =>
                  setLanguage(value as 'en' | 'hi' | 'mr')
                }
              >
                <DropdownMenuRadioItem value="en">
                  English
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hi">
                  Hindi
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="mr">
                  Marathi
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.photoURL ?? ''}
                      alt={user.displayName ?? 'User'}
                    />
                    <AvatarFallback>
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <UserIcon className="mr-2" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push('/admin/dashboard')}
                  >
                    <UserIcon className="mr-2" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col items-start gap-4 p-4">
            {[
              ...navLinks,
              ...(user ? [{ href: '/dashboard', label: t('nav_dashboard') }] : []),
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'w-full rounded-md p-2 text-left transition-colors hover:bg-accent/50',
                  pathname?.startsWith(link.href)
                    ? 'text-primary'
                    : 'text-foreground/80'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
