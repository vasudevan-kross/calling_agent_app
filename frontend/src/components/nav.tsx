'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Search, History, Upload, Bot } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/history', label: 'History', icon: History },
  { href: '/import', label: 'Import', icon: Upload },
]

export function Nav() {
  const pathname = usePathname()

  // Landing page has its own full-page layout — hide the app nav there
  if (pathname === '/' || pathname === '/landing') return null

  return (
    <nav className="sticky top-0 z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">AI Caller</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </Link>
                )
              })}
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
