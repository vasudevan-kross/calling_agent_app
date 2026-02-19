'use client'

import Link from 'next/link'
import { Phone, Users, History, Search, Upload, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLeads } from '@/lib/hooks/use-leads'
import { useCalls } from '@/lib/hooks/use-calls'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  // Count-only queries (fast, no payload)
  const { data: leadsCount, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-count'],
    queryFn: () => api.get<{ count: number }>('/api/leads/count'),
  })
  const { data: activeCount, isLoading: activeLoading } = useQuery({
    queryKey: ['leads-count-active'],
    queryFn: () => api.get<{ count: number }>('/api/leads/count?status=active'),
  })
  const { data: callsCount, isLoading: callsLoading } = useQuery({
    queryKey: ['calls-count'],
    queryFn: () => api.get<{ count: number }>('/api/calls/count'),
  })
  // Small fetch for the recent activity preview lists
  const { data: leads } = useLeads({ limit: 5 })
  const { data: calls } = useCalls({ limit: 5 })

  const stats = [
    {
      title: 'Total Leads',
      value: leadsCount?.count ?? 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Total Calls',
      value: callsCount?.count ?? 0,
      icon: Phone,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Active Leads',
      value: activeCount?.count ?? 0,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ]

  const quickActions = [
    {
      title: 'Search Businesses',
      description: 'Find leads via Google Maps',
      href: '/search',
      icon: Search,
      color: 'bg-primary/20 text-primary',
    },
    {
      title: 'Manage Leads',
      description: 'View and organize contacts',
      href: '/leads',
      icon: Users,
      color: 'bg-green-500/20 text-green-400',
    },
    {
      title: 'Call History',
      description: 'Review past calls',
      href: '/history',
      icon: History,
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      title: 'Import Leads',
      description: 'Upload from file',
      href: '/import',
      icon: Upload,
      color: 'bg-orange-500/20 text-orange-400',
    },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
            AI Calling Dashboard
          </h1>
          <p className="text-secondary">
            Welcome back! Here's your calling activity overview.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={stat.title} className={`animate-slide-up stagger-${i + 1} backdrop-blur-sm bg-white/70 dark:bg-slate-900/60 border-white/60 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary mb-1">{stat.title}</p>
                    {leadsLoading || callsLoading || activeLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold">{stat.value}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor} animate-bounce-subtle`} style={{ animationDelay: `${i * 0.4}s` }}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4 animate-slide-up stagger-4">Quick Actions</h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, i) => (
              <Link key={action.title} href={action.href}>
                <Card hover className={`h-full animate-slide-up stagger-${i + 1} backdrop-blur-sm bg-white/60 dark:bg-slate-900/50 border-white/50 dark:border-slate-700/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className={`p-3 rounded-xl w-fit mb-4 ${action.color} animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-secondary">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Leads</CardTitle>
                <Link href="/leads">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : leads && leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.slice(0, 3).map((lead) => (
                    <Link key={lead.id} href="/leads">
                      <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-secondary">{lead.phone}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center py-4">No leads yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Calls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Calls</CardTitle>
                <Link href="/history">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : calls && calls.length > 0 ? (
                <div className="space-y-3">
                  {calls.slice(0, 3).map((call) => (
                    <div
                      key={call.id}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{call.status}</p>
                        <p className="text-xs text-secondary">
                          {call.provider}
                        </p>
                      </div>
                      <p className="text-sm text-secondary mt-1">
                        {call.purpose || 'No purpose specified'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary text-center py-4">No calls yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
