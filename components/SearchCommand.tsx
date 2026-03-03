'use client'

import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,

  CommandInput,

  CommandList,
} from '@/components/ui/command'
import { Button } from './ui/button'
import { Loader2, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { searchStocks } from '@/lib/actions/finnhub.actions'
import { useDebounce } from '@/hooks/UseDebounce'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist.actions'
import { toast } from 'sonner'

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
  const [updatingSymbol, setUpdatingSymbol] = useState<string | null>(null);

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

  const handleToggleWatchlist = async (stock: StockWithWatchlistStatus) => {
    setUpdatingSymbol(stock.symbol)
    try {
      if (stock.isInWatchlist) {
        await removeFromWatchlist(stock.symbol)
        toast.success(`${stock.symbol} removed from watchlist`)
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? { ...s, isInWatchlist: false } : s
          )
        )
      } else {
        const result = await addToWatchlist({
          symbol: stock.symbol,
          company: stock.name,
        })
        toast.success(
          (result && 'message' in result && typeof result.message === 'string'
            ? result.message
            : `${stock.symbol} added to watchlist`)
        )
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? { ...s, isInWatchlist: true } : s
          )
        )
      }
    } catch (error) {
      console.error('Error updating watchlist from search:', error)
      toast.error('Failed to update watchlist')
    } finally {
      setUpdatingSymbol(null)
    }
  }

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
                  <li
                    key={stock.symbol}
                    className="search-item px-3 py-2 hover:bg-accent rounded-md flex items-center justify-between"
                  >
                    <Link
                      href={`/stock/${stock.symbol}`}
                      onClick={handleSelectStock}
                      className="search-item-link flex items-center gap-3 flex-1"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="search-item-name">
                          {stock.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.exchange} | {stock.type}
                        </div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleWatchlist(stock)
                      }}
                      disabled={updatingSymbol === stock.symbol}
                      className="ml-3 p-1 rounded-full hover:bg-gray-700/60 disabled:opacity-50"
                      aria-label={
                        stock.isInWatchlist
                          ? 'Remove from watchlist'
                          : 'Add to watchlist'
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          stock.isInWatchlist
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-500'
                        }`}
                      />
                    </button>
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
