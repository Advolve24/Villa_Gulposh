// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import RoomCard from "../components/RoomCard";
import CalendarRange from "../components/CalendarRange";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// ---- helpers (UTC date-only) ----
const toUTCDateOnly = (d) => {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
};
// inclusive overlap on calendar days (not times)
const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
  !(aEnd < bStart || aStart > bEnd);

const capacityOf = (room) => {
  if (typeof room?.maxGuests === "number") return room.maxGuests;
  const nums = (room?.accommodation || [])
    .flatMap((s) => Array.from(String(s).matchAll(/\d+/g)).map((m) => Number(m[0])))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? nums.reduce((a, b) => a + b, 0) : 0;
};

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [blockedByRoom, setBlockedByRoom] = useState({}); // { roomId: [{from,to}] }
  const [guests, setGuests] = useState("");
  const [range, setRange] = useState(); // { from, to }

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data));
  }, []);

  // fetch blocked ranges per room, normalize to UTC date-only (inclusive)
  useEffect(() => {
    if (!rooms.length) return;
    (async () => {
      const entries = await Promise.all(
        rooms.map(async (r) => {
          const { data } = await api.get(`/rooms/${r._id}/blocked`);
          const ranges = (data || []).map((b) => ({
            from: toUTCDateOnly(b.startDate),
            to:   toUTCDateOnly(b.endDate),   // treat end as inclusive calendar day
          }));
          return [r._id, ranges];
        })
      );
      setBlockedByRoom(Object.fromEntries(entries));
    })();
  }, [rooms]);

  const hasValidRange = !!(range?.from && range?.to);
  const hasGuests = !!guests;

  const filteredRooms = useMemo(() => {
    if (!hasValidRange || !hasGuests) return rooms;

    // normalize selected range to UTC date-only
    const s = toUTCDateOnly(range.from);
    const e = toUTCDateOnly(range.to);
    const g = Number(guests);

    return rooms.filter((r) => {
      // capacity
      const cap = capacityOf(r);
      if (cap && cap < g) return false;

      // conflicts with any blocked (inclusive)
      const blocked = blockedByRoom[r._id] || [];
      const conflict = blocked.some((b) => rangesOverlap(s, e, b.from, b.to));
      if (conflict) return false;

      return true;
    });
  }, [rooms, blockedByRoom, range, guests, hasValidRange, hasGuests]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 mb-12">
      <h1 className="text-2xl font-heading">Villa Booking</h1>

      <div className="flex flex-col md:flex-row gap-3 items-start">
        <div className="w-full md:w-[50%]">
          <CalendarRange value={range} onChange={setRange} />
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
