"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Star, Trash2 } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist);
  const [loading, setLoading] = useState(false);

  const handleToggleWatchlist = async () => {
    setLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(symbol);
        setInWatchlist(false);
        toast.success(`${symbol} removed from watchlist`);
        onWatchlistChange?.(symbol, false);
      } else {
        await addToWatchlist({ symbol, company });
        setInWatchlist(true);
        toast.success(`${symbol} added to watchlist`);
        onWatchlistChange?.(symbol, true);
      }
    } catch (error) {
      toast.error("Failed to update watchlist");
      console.error("Error toggling watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <button
        onClick={handleToggleWatchlist}
        disabled={loading}
        className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
        aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        type="button"
      >
        {showTrashIcon && inWatchlist ? (
          <Trash2 className="h-5 w-5 text-red-500" />
        ) : (
          <Star
            className={`${
              inWatchlist
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-yellow-500 text-black hover:bg-yellow-400"
            } font-semibold px-6 py-3 rounded-md`}
          />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={loading}
      variant={inWatchlist ? "secondary" : "default"}
      className="gap-2"
    >
      <Star
        className={`h-4 w-4 ${
          inWatchlist ? "fill-yellow-400 text-yellow-400" : ""
        }`}
      />
      {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
    </Button>
  );
};

export default WatchlistButton;
