import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import RoomCard from "../components/RoomCard";
import CalendarRange from "../components/CalendarRange";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const toDateOnlyUTC = (d) => {
  const dt = new Date(d);
  const [y,m,day] = dt.toISOString().slice(0,10).split("-").map(Number);
  return new Date(y, m-1, day);
};
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || aStart > bEnd);

// merge touching/overlapping ranges for efficiency
function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a,b) => a.from - b.from);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.from <= new Date(last.to.getFullYear(), last.to.getMonth(), last.to.getDate() + 1)) {
      if (cur.to > last.to) last.to = cur.to;
    } else {
      out.push(cur);
    }
  }
  return out;
}

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [blockedByRoom, setBlockedByRoom] = useState({});
  const [guests, setGuests] = useState("");
  const [range, setRange] = useState();

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data));
  }, []);

  // fetch blocked ranges per room
  useEffect(() => {
    if (!rooms.length) return;
    (async () => {
      const entries = await Promise.all(
        rooms.map(async (r) => {
          const { data } = await api.get(`/rooms/${r._id}/blocked`);
          const ranges = (data || []).map(b => ({
            from: toDateOnlyUTC(b.startDate),
            to:   toDateOnlyUTC(b.endDate),
          }));
          return [r._id, ranges];
        })
      );
      setBlockedByRoom(Object.fromEntries(entries));
    })();
  }, [rooms]);

  // union of ALL blocked ranges for the Home calendar
  const disabledAll = useMemo(() => {
    const all = Object.values(blockedByRoom).flat();
    return mergeRanges(all);
  }, [blockedByRoom]);

  const hasValidRange = !!(range?.from && range?.to);
  const hasGuests = !!guests;

  const filteredRooms = useMemo(() => {
    if (!hasValidRange || !hasGuests) return rooms;
    const s = toDateOnlyUTC(range.from);
    const e = toDateOnlyUTC(range.to);
    const g = Number(guests);

    return rooms.filter((r) => {
      const cap = typeof r.maxGuests === "number" ? r.maxGuests :
        (r.accommodation || [])
          .flatMap((s) => Array.from(String(s).matchAll(/\d+/g)).map(m => +m[0]))
          .filter(n => Number.isFinite(n) && n > 0)
          .reduce((a,b) => a+b, 0);

      if (cap && cap < g) return false;

      const blocked = blockedByRoom[r._id] || [];
      const conflict = blocked.some((b) => rangesOverlap(s, e, b.from, b.to));
      if (conflict) return false;
      if (cap && cap < g) return false;
      return true;
    });
  }, [rooms, blockedByRoom, range, guests, hasValidRange, hasGuests]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 mb-12">
      <h1 className="text-2xl font-heading">Villa Booking</h1>

      <div className="flex flex-col md:flex-row gap-3 items-start">
        <div className="w-full md:w-[50%]">
          <CalendarRange value={range} onChange={setRange} disabledRanges={disabledAll} />
        </div>

        <div className="w-full md:w-56">
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
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
