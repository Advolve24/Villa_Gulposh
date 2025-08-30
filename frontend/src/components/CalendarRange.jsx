// src/components/CalendarRange.jsx
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { api } from "../api/http";
import { useState } from "react";

function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function todayDateOnly() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function CalendarRange({
  roomId,              // optional: fetch only this room’s blocks
  value,               // { from?: Date, to?: Date }
  onChange,            // (range) => void
  disabledRanges,      // optional: [{from: Date, to: Date}] UNION from the parent
}) {
  const [blockedRanges, setBlockedRanges] = useState([]);

  // Fetch when roomId is provided (single-room page)
  useEffect(() => {
    if (!roomId) return;
    api.get(`/rooms/${roomId}/blocked`).then(({ data }) => {
      const ranges = (data || []).map((b) => ({
        from: toDateOnly(b.startDate),
        to: toDateOnly(b.endDate), // inclusive
      }));
      setBlockedRanges(ranges);
    });
  }, [roomId]);

  // Final disabled list: past + (parent union OR fetched single-room)
  const disabledList = useMemo(() => {
    const base = [{ before: todayDateOnly() }];
    const extra = (disabledRanges && disabledRanges.length)
      ? disabledRanges
      : blockedRanges;
    return [...base, ...extra];
  }, [disabledRanges, blockedRanges]);

  // Utility: is a specific day disabled?
  const isDisabledDay = (day) => {
    const d = toDateOnly(day);
    return disabledList.some((rule) => {
      if (rule.before && d < toDateOnly(rule.before)) return true;
      if (rule.after && d > toDateOnly(rule.after)) return true;
      if (rule.from && rule.to) {
        const f = toDateOnly(rule.from);
        const t = toDateOnly(rule.to);
        return d >= f && d <= t; // inclusive
      }
      return false;
    });
  };

  // Guard: ignore selections that touch a disabled day
  const handleSelect = (next) => {
    if (!next) return onChange?.(next);
    const a = next?.from ? toDateOnly(next.from) : null;
    const b = next?.to ? toDateOnly(next.to) : null;
    if ((a && isDisabledDay(a)) || (b && isDisabledDay(b))) {
      return; // do nothing if user clicks a blocked day
    }
    onChange?.(next);
  };

  // If the current selection later becomes invalid (due to async blocks), clear it
  useEffect(() => {
    if (!value?.from && !value?.to) return;
    const aBad = value?.from && isDisabledDay(value.from);
    const bBad = value?.to && isDisabledDay(value.to);
    if (aBad || bBad) onChange?.(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(disabledList)]);

  const checkIn  = value?.from ? format(value.from, "dd MMM yyyy") : "Add date";
  const checkOut = value?.to   ? format(value.to,   "dd MMM yyyy") : "Add date";

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full grid grid-cols-2 items-center gap-0.5 font-normal">
            <span className="flex items-center gap-2">
              <span className="text-xs uppercase text-gray-500">Check in</span>
              <span className="truncate">{checkIn}</span>
            </span>
            <span className="flex items-center gap-2 border-l pl-3">
              <span className="text-xs uppercase text-gray-500">Check out</span>
              <span className="truncate">{checkOut}</span>
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disabledList}
            captionLayout="dropdown-buttons"
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
