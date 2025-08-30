import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const toDateOnlyUTC = (d) => {
  const dt = new Date(d);
  const [y,m,day] = dt.toISOString().slice(0,10).split("-").map(Number);
  return new Date(y, m-1, day);
};
const todayDateOnly = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};

export default function CalendarRange({ roomId, value, onChange, disabledRanges }) {
  const [blockedRanges, setBlockedRanges] = useState([]);

  // fetch only when a specific room is supplied and no external ranges were passed
  useEffect(() => {
    if (!roomId || disabledRanges) return;
    api.get(`/rooms/${roomId}/blocked`).then(({ data }) => {
      const ranges = (data || []).map(b => ({
        from: toDateOnlyUTC(b.startDate),
        to:   toDateOnlyUTC(b.endDate),
      }));
      setBlockedRanges(ranges);
    });
  }, [roomId, disabledRanges]);

  const checkIn  = value?.from ? format(value.from, "dd MMM yyyy") : "Add date";
  const checkOut = value?.to   ? format(value.to,   "dd MMM yyyy") : "Add date";

  const disabled = useMemo(() => {
    const src = disabledRanges ?? blockedRanges;
    return [{ before: todayDateOnly() }, ...(src || [])];
  }, [disabledRanges, blockedRanges]);

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full grid grid-cols-2 items-center gap-0.5 font-normal">
            <span className="flex gap-2">
              <span className="text-xs uppercase text-gray-500">Check in</span>
              <span className="truncate">{checkIn}</span>
            </span>
            <span className="flex gap-2 border-l pl-3">
              <span className="text-xs uppercase text-gray-500">Check out</span>
              <span className="truncate">{checkOut}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={disabled}
            captionLayout="dropdown-buttons"
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
