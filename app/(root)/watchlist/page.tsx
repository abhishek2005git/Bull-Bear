import Link from 'next/link'
import SearchCommand from '@/components/SearchCommand'
import WatchlistButton from '@/components/WatchlistButton'
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'
import { getWatchlistByEmail } from '@/lib/actions/watchlist.actions'
import { getBasicFinancials, getNews, getProfile, getQuote, searchStocks } from '@/lib/actions/finnhub.actions'
import { formatChangePercent, formatMarketCapValue, formatPrice, formatTimeAgo, getChangeColorClass } from '@/lib/utils'

const WatchlistPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  const email = session?.user?.email

  const [initialStocks, watchlistItems] = await Promise.all([
    searchStocks(),
    email ? getWatchlistByEmail(email) : Promise.resolve([]),
  ])

  const symbols = watchlistItems.map((w) => w.symbol?.toUpperCase()).filter(Boolean)

  const [news, watchlistWithData] = await Promise.all([
    getNews(symbols),
    Promise.all(
      watchlistItems.map(async (item) => {
        const symbol = item.symbol.toUpperCase()
        const [quote, profile, financials] = await Promise.all([
          getQuote(symbol),
          getProfile(symbol),
          getBasicFinancials(symbol),
        ])

        const currentPrice = quote?.c
        const changePercent = quote?.dp

        const pe = financials?.metric?.peTTM ?? financials?.metric?.peBasicExclExtraTTM
        const marketCapUsd = profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : undefined

        const enriched: StockWithData = {
          ...item,
          symbol,
          company: item.company || profile?.name || symbol,
          currentPrice,
          changePercent,
          priceFormatted: typeof currentPrice === 'number' ? formatPrice(currentPrice) : '—',
          changeFormatted: typeof changePercent === 'number' ? formatChangePercent(changePercent) : '—',
          marketCap: typeof marketCapUsd === 'number' ? formatMarketCapValue(marketCapUsd) : '—',
          peRatio: typeof pe === 'number' ? pe.toFixed(1) : '—',
        }

        return enriched
      })
    ),
  ])

  if (!watchlistWithData.length) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <div className="watchlist-star">★</div>
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Search for a stock and add it to your watchlist to track price, change, and news.
          </p>
          <SearchCommand label="Add Stock" initialStocks={initialStocks} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="watchlist-container">
        <div className="watchlist">
          <div className="flex items-center justify-between">
            <h1 className="watchlist-title">Watchlist</h1>
            <SearchCommand label="Add Stock" initialStocks={initialStocks} />
          </div>

          <div className="watchlist-table">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header-row">
                  {WATCHLIST_TABLE_HEADER.map((h) => (
                    <th key={h} className="table-header px-3 py-3 text-sm">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlistWithData.map((row) => (
                  <tr key={row.symbol} className="table-row">
                    <td className="table-cell px-3 py-4">
                      <Link href={`/stock/${row.symbol}`} className="hover:text-yellow-500 transition-colors">
                        {row.company}
                      </Link>
                    </td>
                    <td className="table-cell px-3 py-4">{row.symbol}</td>
                    <td className="table-cell px-3 py-4">{row.priceFormatted}</td>
                    <td className={`table-cell px-3 py-4 ${getChangeColorClass(row.changePercent)}`}>
                      {row.changeFormatted}
                    </td>
                    <td className="table-cell px-3 py-4">{row.marketCap}</td>
                    <td className="table-cell px-3 py-4">{row.peRatio}</td>
                    <td className="table-cell px-3 py-4">
                      <button type="button" className="add-alert" disabled>
                        Add Alert
                      </button>
                    </td>
                    <td className="table-cell px-3 py-4">
                      <WatchlistButton
                        symbol={row.symbol}
                        company={row.company}
                        isInWatchlist
                        type="icon"
                        showTrashIcon
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="watchlist-alerts">
          <div className="flex items-center justify-between w-full">
            <h2 className="watchlist-title">Alerts</h2>
            <button type="button" className="search-btn" disabled>
              Create Alert
            </button>
          </div>

          <div className="alert-list">
            <div className="alert-empty">Alerts UI is ready — wire up create/list actions next.</div>
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">News</h2>
        </div>

        <div className="watchlist-news">
          {(news ?? []).map((article) => (
            <a
              key={article.id}
              className="news-item"
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <div className="news-tag">{(article.related || article.source || 'NEWS').toUpperCase()}</div>
              <div className="news-title">{article.headline}</div>
              <div className="news-meta">{formatTimeAgo(article.datetime)}</div>
              <div className="news-summary">{article.summary}</div>
              <div className="news-cta">Read more →</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default WatchlistPage

