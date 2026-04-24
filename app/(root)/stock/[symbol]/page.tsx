import TradingViewWidget from '@/components/TradingViewWidget'
import WatchlistButton from '@/components/WatchlistButton'
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from '@/lib/constants'
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions'
import { getProfile } from '@/lib/actions/finnhub.actions'
import { auth } from '@/lib/better-auth/auth'
import { headers } from 'next/headers'

type StockDetailsProps = {
  params: Promise<{
    symbol: string
  }>
}

const StockDetails = async ({ params }: StockDetailsProps) => {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  // Check if stock is in user's watchlist
  let isInWatchlist = false
  const companyName = upperSymbol

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user?.email) {
      const watchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email)
      isInWatchlist = watchlistSymbols.includes(upperSymbol)
    }
  } catch (error) {
    console.error('Error checking watchlist status:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        {/* <h1 className="text-3xl font-bold text-gray-100">{upperSymbol}</h1> */}
        <WatchlistButton
          symbol={upperSymbol}
          company={companyName}
          isInWatchlist={isInWatchlist}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TradingViewWidget
            title="Symbol Info"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
            config={SYMBOL_INFO_WIDGET_CONFIG(upperSymbol)}
            height={170}
          />

          <TradingViewWidget
            title="Candlestick Chart"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            config={CANDLE_CHART_WIDGET_CONFIG(upperSymbol)}
            height={600}
          />

          <TradingViewWidget
            title="Baseline Chart"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            config={BASELINE_WIDGET_CONFIG(upperSymbol)}
            height={600}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <TradingViewWidget
            title="Technical Analysis"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(upperSymbol)}
            height={400}
          />

          <TradingViewWidget
            title="Company Profile"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js"
            config={COMPANY_PROFILE_WIDGET_CONFIG(upperSymbol)}
            height={440}
          />

          <TradingViewWidget
            title="Company Financials"
            scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-financials.js"
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(upperSymbol)}
            height={464}
          />
        </div>
      </div>
    </div>
  )
}

export default StockDetails
