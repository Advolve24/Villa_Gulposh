// src/components/CalendarRange.jsx
import { useEffect, useState } from "react";
import { api } from "../api/http";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
function todayDateOnly() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function CalendarRange({ roomId, value, onChange }) {
  const [blockedRanges, setBlockedRanges] = useState([]); // [{ from, to }]

  useEffect(() => {
    if (!roomId) return;
    api.get(`/rooms/${roomId}/blocked`).then(({ data }) => {
      const ranges = data.map(b => ({
        from: toDateOnly(b.startDate),
        to: toDateOnly(b.endDate),
      }));
      setBlockedRanges(ranges);
    });
  }, [roomId]);

  const checkIn  = value?.from ? format(value.from, "dd MMM yyyy") : "Add date";
  const checkOut = value?.to   ? format(value.to,   "dd MMM yyyy") : "Add date";

  const disabled = [
    { before: todayDateOnly() }, // disable all past dates
    ...blockedRanges,
  ];

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full grid grid-cols-2 items-center gap-0.5 font-normal"
          >
            {/* Left: Check in */}
            <span className="flex flex-row items-center justify-start gap-2">
              <span className="text-xs uppercase text-gray-500">Check in</span>
              <span className="truncate">{checkIn}</span>
            </span>

            {/* Right: Check out */}
            <span className="flex flex-row items-center justify-start gap-2 border-l pl-3">
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
