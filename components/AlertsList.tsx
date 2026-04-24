"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Alert } from "@/types/alert"; // adjust path as needed
import {
  getAlertText,
  formatPrice,
  formatChangePercent,
  getChangeColorClass,
} from "@/lib/utils";
type AlertsListPropsInternal = {
  alertData: Alert[] | undefined;
  onEdit: (alert: Alert) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

const getFrequencyLabel = (alert: Alert) => {
  // Simple placeholder mapping to mimic the UI pill
  return alert.alertType === "upper" ? "Once per day" : "Once per hour";
};

const AlertsList = ({
  alertData,
  onEdit,
  onDelete,
  deletingId,
}: AlertsListPropsInternal) => {
  const alerts = alertData ?? [];

  if (!alerts.length) {
    return (
      <div className="alert-list">
        <div className="alert-empty">
          Alerts UI is ready — create your first price alert to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="alert-list">
      {alerts.map((alert) => {
        const price = formatPrice(alert.currentPrice ?? alert.threshold);
        const change =
          typeof alert.changePercent === "number"
            ? formatChangePercent(alert.changePercent)
            : "";
        const changeClass = getChangeColorClass(alert.changePercent);
        const initial = alert.company?.charAt(0)?.toUpperCase() || "•";

        return (
          <div key={alert.id} className="alert-item">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="alert-logo">
                  <span className="alert-logo-initial">{initial}</span>
                </div>
                <div>
                  <div className="alert-company-row">
                    <span className="alert-company-name">{alert.company}</span>
                    <span className="alert-company-symbol">{alert.symbol}</span>
                  </div>
                  <div className="alert-price-row">
                    <span className="alert-price-main">{price}</span>
                    {change && (
                      <span className={`alert-price-change ${changeClass}`}>
                        {change}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="alert-update-icon"
                onClick={() => onEdit(alert)}
                aria-label="Edit alert"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <div className="alert-name">Alert</div>
              <div className="text-sm text-gray-300">{getAlertText(alert)}</div>
            </div>

            <div className="alert-actions">
              <span className="alert-frequency-pill">
                {getFrequencyLabel(alert)}
              </span>
              <button
                type="button"
                className="alert-delete-btn px-3 py-1.5 text-sm flex items-center gap-1"
                onClick={() => onDelete(alert.id)}
                disabled={deletingId === alert.id}
              >
                <Trash2 className="w-4 h-4" />
                {deletingId === alert.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsList;
