'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database, Home, AlertTriangle, FileText, ChevronDown, ChevronRight, Search, Users } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Data Extractor', href: '/data-extractor', icon: Database },
  { 
    name: 'Property Leads', 
    icon: AlertTriangle,
    children: [
      { name: 'Code Violations', href: '/property-leads/code-violations' },
      { name: 'Building Permits', href: '/property-leads/permits' },
      { name: 'Fire Calls', href: '/property-leads/fire-calls' },
    ]
  },
  { 
    name: 'Scraper', 
    icon: Search,
    children: [
      { name: 'Evictions', href: '/scraper/evictions' },
      { name: 'Foreclosures', href: '/scraper/foreclosures' },
      { name: 'Probate', href: '/scraper/probate' },
    ]
  },
  { 
    name: 'Skip Trace', 
    icon: Users,
    children: [
      { name: 'Name Search', href: '/skip-trace/name' },
      { name: 'Address Lookup', href: '/skip-trace/address' },
      { name: 'Phone Lookup', href: '/skip-trace/phone' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Property Leads'])

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-xl font-bold text-white">ReiDataTools</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const hasChildren = 'children' in item && item.children
          const isExpanded = expandedItems.includes(item.name)
          const isActive = item.href ? (pathname === item.href || pathname?.startsWith(item.href + '/')) : false
          const isChildActive = hasChildren && item.children?.some(child => pathname === child.href)

          if (hasChildren) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpand(item.name)}
                  className={clsx(
                    'flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isChildActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const isChildItemActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={clsx(
                            'flex items-center px-4 py-2 text-sm rounded-lg transition-colors',
                            isChildItemActive
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          © 2026 ReiDataTools
        </p>
      </div>
    </div>
  )
}
