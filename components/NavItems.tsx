'use client'
import React from 'react'
import Link from 'next/link'
import { NAV_ITEMS } from '@/lib/constants'
import { usePathname } from 'next/navigation'
import SearchCommand from './SearchCommand'

const NavItems = ({ initialStocks }: { initialStocks: StockWithWatchlistStatus[] }) => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path);
  }

  return (
    <ul className='flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium'>
      {NAV_ITEMS.map((item) => {

        if(item.label === 'Search') return (
          <li key = "search-trigger">
            <SearchCommand renderAs="text"  label="Search" initialStocks={initialStocks}/>
          </li>
        )

        return <li key={item.href}>
          <Link href={item.href} className={`hover:text-yellow-500 transition-colors ${isActive(item.href) ? 'text-gray-100' : ''}`}>{item.label}</Link>
        </li>
      })}
    </ul>
  )
}

export default NavItems
