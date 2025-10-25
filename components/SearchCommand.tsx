'use client'

import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from './ui/button'
import { Loader2, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { searchStocks } from '@/lib/actions/finnhub.actions'
import { useDebounce } from '@/hooks/UseDebounce'

interface SearchCommandProps {
  renderAs?: 'button' | 'text'
  label?: string
  initialStocks?: StockWithWatchlistStatus[]
}

const SearchCommand = ({
  renderAs = 'button',
  label = 'Add stock',
  initialStocks = [],
}: SearchCommandProps) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim()
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10)



  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  

  const handleSearch = async () => {
    if(!isSearchMode) return setStocks(initialStocks);
    setLoading(true);
    try {
      const results = await searchStocks(searchTerm)
      setStocks(results)
    } catch (error) {
      console.error('Error searching stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const debounceSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debounceSearch()
  }, [searchTerm])

  const handleSelectStock = () => {
    //console.log('Selected stock:', value)
    setOpen(false);
    setSearchTerm('');
    setStocks(initialStocks);
  }

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={() => setOpen(true)} className="search-text cursor-pointer">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field flex items-center gap-2 p-2">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search Stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="animate-spin w-4 h-4 text-gray-500" />}
        </div>

        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty">Loading Stocks...</CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="search-list-indicator p-3 text-center text-sm text-muted-foreground">
              {isSearchMode ? (
                <CommandEmpty>No results found</CommandEmpty>
              ) : (
                <CommandEmpty>No stocks added</CommandEmpty>
              )}
            </div>
          ) : (
            <>
              <div className="search-count px-3 py-1 text-sm font-medium text-gray-500">
                {isSearchMode ? 'Search results' : 'Popular stocks'} {` `}({displayStocks?.length || 0})
              </div>
              <ul>
                {displayStocks?.map((stock) => (
                  <li key={stock.symbol} className="search-item px-3 py-2 hover:bg-accent rounded-md">
                    <Link
                      href={`/stock/${stock.symbol}`}
                      onClick={handleSelectStock}
                      className="search-item-link block"
                    >
                      <TrendingUp  className='h-4 w-4 text-gray-500'/>
                      <div className="flex-1">
                        <div className='search-item-name'>
                          {stock.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {stock.symbol} | {stock.exchange} | {stock.type}
                        </div>
                      </div>
                    </Link>

                    <Star />
                  </li>
                ))}
              </ul>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default SearchCommand
