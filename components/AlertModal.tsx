"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ALERT_TYPE_OPTIONS } from "@/lib/constants"
import { toast } from "sonner"
import { createAlert, updateAlert } from "@/lib/actions/alert.actions"

type AlertModalPropsExtended = AlertModalProps & {
  onCompleted: (alert: Alert) => void
}

const AlertModal = ({
  alertId,
  alertData,
  action = "create",
  open,
  setOpen,
  onCompleted,
}: AlertModalPropsExtended) => {
  const [form, setForm] = useState<AlertData>({
    symbol: alertData?.symbol || "",
    company: alertData?.company || "",
    alertName: alertData?.alertName || "",
    alertType: alertData?.alertType || "upper",
    threshold: alertData?.threshold || "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (alertData) {
      setForm({
        symbol: alertData.symbol,
        company: alertData.company,
        alertName: alertData.alertName || "",
        alertType: alertData.alertType,
        threshold: alertData.threshold,
      })
    }
  }, [alertData, open])

  const handleChange = (
    field: keyof AlertData,
    value: string | AlertData["alertType"]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.symbol || !form.company) {
      toast.error("Symbol and company are required")
      return
    }
    if (!form.threshold || Number.isNaN(Number(form.threshold))) {
      toast.error("Please enter a valid price threshold")
      return
    }

    setSubmitting(true)
    try {
      if (alertId) {
        const result = await updateAlert({
          alertId,
          data: {
            alertName: form.alertName,
            alertType: form.alertType,
            threshold: form.threshold,
          },
        })

        if (!result.success || !result.alert) {
          throw new Error(result.message || "Failed to update alert")
        }

        onCompleted(result.alert)
        toast.success(result.message || "Alert updated")
      } else {
        const result = await createAlert(form)

        if (!result.success || !result.alert) {
          if (result.success) {
            // Duplicate alert case where we still consider it a success
            toast.success(result.message || "Alert already exists")
            setOpen(false)
            return
          }
          throw new Error(result.message || "Failed to create alert")
        }

        onCompleted(result.alert)
        toast.success(result.message || "Alert created")
      }

      setOpen(false)
    } catch (error: any) {
      console.error("Error submitting alert form:", error)
      toast.error(error?.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const title = action === "update" ? "Update Alert" : "Create Alert"
  const description =
    action === "update"
      ? "Adjust the conditions for this price alert."
      : "Create a new alert to be notified when the price moves."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Symbol</p>
            <p className="font-medium text-gray-100">
              {form.symbol || "Select from your watchlist"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Company</p>
            <p className="font-medium text-gray-100">
              {form.company || "—"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300" htmlFor="alertName">
              Alert name
            </label>
            <input
              id="alertName"
              className="auth-input"
              placeholder="e.g. Price breaks above resistance"
              value={form.alertName}
              onChange={(e) => handleChange("alertName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-gray-300" htmlFor="alertType">
                Direction
              </label>
              <select
                id="alertType"
                className="auth-input"
                value={form.alertType}
                onChange={(e) =>
                  handleChange("alertType", e.target.value as AlertData["alertType"])
                }
              >
                {ALERT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300" htmlFor="threshold">
                Target price (USD)
              </label>
              <input
                id="threshold"
                type="number"
                min="0"
                step="0.01"
                className="auth-input"
                placeholder="Enter target price"
                value={form.threshold}
                onChange={(e) => handleChange("threshold", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : action === "update" ? "Update Alert" : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AlertModal

