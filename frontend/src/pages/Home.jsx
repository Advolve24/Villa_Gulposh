import { useEffect, useMemo, useState } from "react";
import { api } from "../api/http";
import RoomCard from "../components/RoomCard";
import CalendarRange from "../components/CalendarRange";
import { useAuth } from "../store/authStore";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const toDateOnly = (d) => {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || aStart > bEnd);

const capacityOf = (room) => {
  if (typeof room?.maxGuests === "number")
    return room.maxGuests;
  const nums = (room?.accommodation || [])
    .flatMap((s) => Array.from(String(s)
      .matchAll(/\d+/g)).map((m) => Number(m[0])))
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

  useEffect(() => {
    if (!rooms.length)
      return;
    (async () => {
      const entries = await Promise.all(rooms.map(async (r) => {
        const { data } = await api.get(`/rooms/${r._id}/blocked`);
        const ranges = (data || []).map((b) =>
        ({
          from: toDateOnly(b.startDate || b.from), to: toDateOnly(b.endDate || b.to),
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
    if (!hasValidRange || !hasGuests)
      return rooms;
    const s = toDateOnly(range.from);
    const e = toDateOnly(range.to);
    const g = Number(guests);
    return rooms.filter((r) => {
      const cap = capacityOf(r);
      if (cap && cap < g)
        return false;
      const blocked = blockedByRoom[r._id] || [];
      const conflict = blocked.some((b) => rangesOverlap(s, e, b.from, b.to));
      if (conflict)
        return false;
      return true;
    });
  }, [rooms, blockedByRoom, range, guests, hasValidRange, hasGuests]);
  return (

    <div className="max-w-6xl mx-auto p-4 space-y-6 mb-12">
      <h1 className="text-2xl font-heading">Villa Booking</h1>
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-start">
        {/* Date range */}
        <div className="w-full md:w-[50%]">
          <CalendarRange value={range} onChange={setRange} />
        </div>
        {/* Guests selector 1..10 */}
        <div className="w-full md:w-56">
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}> {n} </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading">Available rooms</h2>
        <span className="text-sm text-gray-600">
          {filteredRooms.length} of {rooms.length} shown
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filteredRooms.map((r) => (<RoomCard key={r._id} room={r} range={range} guests={guests} />
        ))}
      </div>
    </div>
  );
}