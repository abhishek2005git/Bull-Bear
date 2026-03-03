"use client"

import { useState } from "react"
import Link from "next/link"
import SearchCommand from "@/components/SearchCommand"
import WatchlistButton from "@/components/WatchlistButton"
import AlertsList from "@/components/AlertsList"
import AlertModal from "@/components/AlertModal"
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants"
import { getChangeColorClass } from "@/lib/utils"
import { deleteAlert } from "@/lib/actions/alert.actions"
import { toast } from "sonner"

interface WatchlistAlertsSectionProps {
  initialStocks: StockWithWatchlistStatus[]
  watchlistWithData: StockWithData[]
  news?: MarketNewsArticle[]
  initialAlerts?: Alert[]
}

const WatchlistAlertsSection = ({
  initialStocks,
  watchlistWithData,
  news,
  initialAlerts = [],
}: WatchlistAlertsSectionProps) => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<"create" | "update">("create")
  const [editingAlertId, setEditingAlertId] = useState<string | undefined>()
  const [modalData, setModalData] = useState<AlertData | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreateForRow = (row: StockWithData) => {
    setModalAction("create")
    setEditingAlertId(undefined)
    setModalData({
      symbol: row.symbol,
      company: row.company,
      alertName: `${row.symbol} price alert`,
      alertType: "upper",
      threshold: row.currentPrice ? String(row.currentPrice) : "",
    })
    setModalOpen(true)
  }

  const openCreateGeneric = () => {
    const first = watchlistWithData[0]
    if (!first) {
      toast.error("Add a stock to your watchlist before creating alerts")
      return
    }
    openCreateForRow(first)
  }

  const handleAlertCompleted = (alert: Alert) => {
    setAlerts((prev) => {
      const index = prev.findIndex((a) => a.id === alert.id)
      if (index === -1) {
        return [alert, ...prev]
      }
      const copy = [...prev]
      copy[index] = alert
      return copy
    })
  }

  const handleEditAlert = (alert: Alert) => {
    setModalAction("update")
    setEditingAlertId(alert.id)
    setModalData({
      symbol: alert.symbol,
      company: alert.company,
      alertName: alert.alertName,
      alertType: alert.alertType,
      threshold: String(alert.threshold),
    })
    setModalOpen(true)
  }

  const handleDeleteAlert = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteAlert(id)
      if (!result.success) {
        throw new Error(result.message)
      }
      setAlerts((prev) => prev.filter((alert) => alert.id !== id))
      toast.success(result.message || "Alert deleted")
    } catch (error) {
      console.error("Error deleting alert:", error)
      if (error instanceof Error) {
        toast.error(error.message || "Failed to delete alert")
      } else {
        toast.error("Failed to delete alert")
      }
    } finally {
      setDeletingId(null)
    }
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
                  <th className="table-header px-3 py-3 text-sm" />
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
                      <WatchlistButton
                        symbol={row.symbol}
                        company={row.company}
                        isInWatchlist
                        type="icon"
                      />
                    </td>
                    <td className="table-cell px-3 py-4">
                      <Link
                        href={`/stock/${row.symbol}`}
                        className="hover:text-yellow-500 transition-colors"
                      >
                        {row.company}
                      </Link>
                    </td>
                    <td className="table-cell px-3 py-4">{row.symbol}</td>
                    <td className="table-cell px-3 py-4">
                      {row.priceFormatted}
                    </td>
                    <td
                      className={`table-cell px-3 py-4 ${getChangeColorClass(
                        row.changePercent
                      )}`}
                    >
                      {row.changeFormatted}
                    </td>
                    <td className="table-cell px-3 py-4">{row.marketCap}</td>
                    <td className="table-cell px-3 py-4">{row.peRatio}</td>
                    <td className="table-cell px-3 py-4">
                      <button
                        type="button"
                        className="add-alert"
                        onClick={() => openCreateForRow(row)}
                      >
                        Add Alert
                      </button>
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
            <button
              type="button"
              className="search-btn"
              onClick={openCreateGeneric}
            >
              Create Alert
            </button>
          </div>

          <AlertsList
            alertData={alerts}
            onEdit={handleEditAlert}
            onDelete={handleDeleteAlert}
            deletingId={deletingId}
          />
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
              <div className="news-tag">
                {(article.related || article.source || "NEWS").toUpperCase()}
              </div>
              <div className="news-title">{article.headline}</div>
              <div className="news-meta">
                {/* We keep relative time formatting on the server; here we show raw date */}
                {new Date(article.datetime * 1000).toLocaleString()}
              </div>
              <div className="news-summary">{article.summary}</div>
              <div className="news-cta">Read more →</div>
            </a>
          ))}
        </div>
      </section>

      {modalData && (
        <AlertModal
          open={modalOpen}
          setOpen={setModalOpen}
          alertId={modalAction === "update" ? editingAlertId : undefined}
          alertData={modalData}
          action={modalAction}
          onCompleted={handleAlertCompleted}
        />
      )}
    </div>
  )
}

export default WatchlistAlertsSection

