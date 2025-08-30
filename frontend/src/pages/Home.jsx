// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import RoomCard from "../components/RoomCard";
import CalendarRange from "../components/CalendarRange";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const DAY = 24 * 60 * 60 * 1000;
const toDateOnly = (d) => {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};
const rangesOverlapOrTouch = (a, b) => a.from <= new Date(b.to.getTime() + DAY) && b.from <= new Date(a.to.getTime() + DAY);
// If you want strict overlap only, drop the “+ DAY”.

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || aStart > bEnd);

const capacityOf = (room) => {
  if (typeof room?.maxGuests === "number") return room.maxGuests;
  const nums = (room?.accommodation || [])
    .flatMap((s) => Array.from(String(s).matchAll(/\d+/g)).map((m) => Number(m[0])))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? nums.reduce((a, b) => a + b, 0) : 0;
};

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [blockedByRoom, setBlockedByRoom] = useState({});
  const [guests, setGuests] = useState("");
  const [range, setRange] = useState();

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data));
  }, []);

  // Load each room's blocked ranges (for filtering)
  useEffect(() => {
    if (!rooms.length) return;
    (async () => {
      const entries = await Promise.all(
        rooms.map(async (r) => {
          const { data } = await api.get(`/rooms/${r._id}/blocked`);
          const ranges = (data || []).map((b) => ({
            from: toDateOnly(b.startDate),
            to: toDateOnly(b.endDate),
          }));
          return [r._id, ranges];
        })
      );
      setBlockedByRoom(Object.fromEntries(entries));
    })();
  }, [rooms]);

  // 🔒 Merge all blocked ranges (so Home calendar shows disabled days too)
  const globallyDisabled = useMemo(() => {
    const all = Object.values(blockedByRoom).flat();
    if (!all.length) return [];
    const sorted = all
      .map(r => ({ from: toDateOnly(r.from), to: toDateOnly(r.to) }))
      .sort((a, b) => a.from - b.from);

    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const last = merged[merged.length - 1];
      if (rangesOverlapOrTouch(last, cur)) {
        // merge
        if (cur.to > last.to) last.to = cur.to;
      } else {
        merged.push(cur);
      }
    }
    return merged;
  }, [blockedByRoom]);

  // Filtering (capacity + availability). If you changed overlap to end-exclusive,
  // adjust here as well.
  const hasValidRange = !!(range?.from && range?.to);
  const hasGuests = !!guests;

  const filteredRooms = useMemo(() => {
    if (!hasValidRange || !hasGuests) return rooms;

    const s = toDateOnly(range.from);
    const e = toDateOnly(range.to);
    const g = Number(guests);

    return rooms.filter((r) => {
      const cap = capacityOf(r);
      if (cap && cap < g) return false;

      const blocked = blockedByRoom[r._id] || [];
      const conflict = blocked.some((b) => rangesOverlap(s, e, toDateOnly(b.from), toDateOnly(b.to)));
      if (conflict) return false;

      return true;
    });
  }, [rooms, blockedByRoom, range, guests, hasValidRange, hasGuests]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 mb-12">
      <h1 className="text-2xl font-heading">Villa Booking</h1>

      <div className="flex flex-col md:flex-row gap-3 items-start">
        {/* Now we pass the merged disabled ranges */}
        <div className="w-full md:w-[50%]">
          <CalendarRange
            value={range}
            onChange={setRange}
            disabledRanges={globallyDisabled}
          />
        </div>

        <div className="w-full md:w-56">
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading">Available rooms</h2>
        <span className="text-sm text-gray-600">
          {filteredRooms.length} of {rooms.length} shown
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filteredRooms.map((r) => (
          <RoomCard key={r._id} room={r} range={range} guests={guests} />
        ))}
      </div>
    </div>
  );
}
