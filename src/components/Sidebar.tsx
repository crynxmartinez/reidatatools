'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database, Home } from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Property Data Extractor', href: '/data-extractor', icon: Database },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-xl font-bold text-white">ReiDataTools</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
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
          © 2026 ReiDataTools CRM
        </p>
      </div>
    </div>
  )
}
