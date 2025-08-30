// src/pages/RoomPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/http";
import CalendarRange from "../components/CalendarRange";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import ImageSlider from "../components/ImageSlider";

export default function RoomPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [blockedByRoom, setBlockedByRoom] = useState({});

  const [room, setRoom] = useState(null);
  const [range, setRange] = useState();     
  const [guests, setGuests] = useState(""); 

  useEffect(() => {
    api.get(`/rooms/${id}`).then(({ data }) => setRoom(data)).catch(() => setRoom(null));
  }, [id]);

  // Seed dates + guests from state / query (once)
  useEffect(() => {
    const stateFrom = location.state?.from;
    const stateTo = location.state?.to;
    const stateGuests = location.state?.guests;

    const qpFrom = searchParams.get("from");
    const qpTo = searchParams.get("to");
    const qpGuests = searchParams.get("guests");

    const fromISO = stateFrom || qpFrom;
    const toISO   = stateTo   || qpTo;

    if (fromISO && toISO) {
      const from = new Date(fromISO);
      const to   = new Date(toISO);
      if (!isNaN(from) && !isNaN(to)) setRange({ from, to });
    }

    const g = stateGuests || qpGuests;
    if (g) setGuests(String(g));
  }, []);

  // Keep query params in sync for refresh/share
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    if (range?.from && range?.to) {
      sp.set("from", range.from.toISOString());
      sp.set("to", range.to.toISOString());
    } else {
      sp.delete("from"); sp.delete("to");
    }
    setSearchParams(sp, { replace: true });
  }, [range]);

  const onGuestsChange = (v) => {
    setGuests(v);
    const sp = new URLSearchParams(searchParams);
    if (v) sp.set("guests", v); else sp.delete("guests");
    setSearchParams(sp, { replace: true });
  };

  // ---- NEW: compute per-room capacity cap ----
  const maxGuestsCap = useMemo(() => {
    if (!room) return null;
    if (typeof room.maxGuests === "number" && room.maxGuests > 0) return room.maxGuests;

    const nums = (room.accommodation || [])
      .flatMap((s) => Array.from(String(s).matchAll(/\d+/g)).map((m) => Number(m[0])))
      .filter((n) => Number.isFinite(n) && n > 0);

    const sum = nums.length ? nums.reduce((a, b) => a + b, 0) : 0;
    return Math.max(1, sum || 1);
  }, [room]);

useEffect(() => {
    if (!room) return;              
    if (!maxGuestsCap) return;      
    if (!guests) return;            
    const g = Number(guests);
    if (Number.isFinite(g) && g > maxGuestsCap) {
      setGuests(String(maxGuestsCap));
    }
}, [room, maxGuestsCap, guests]);

  // Proceed to checkout (auth is enforced there)
  const goToCheckout = () => {
    if (!range?.from || !range?.to) return alert("Select dates first");
    if (!guests) return alert("Select number of guests");
    navigate("/checkout", {
      state: {
        roomId: room._id,
        startDate: range.from,
        endDate: range.to,
        guests: Number(guests),
      },
    });
  };


  useEffect(() => {
  api.get("/rooms").then(async ({ data }) => {
    const entries = await Promise.all(
      data.map(async (r) => {
        const { data: blocked } = await api.get(`/rooms/${r._id}/blocked`);
        const ranges = (blocked || []).map(b => ({
          from: new Date(b.startDate),
          to: new Date(b.endDate),
        }));
        return [r._id, ranges];
      })
    );
    setBlockedByRoom(Object.fromEntries(entries));
  });
}, []);

const disabledAll = useMemo(() => {
  const all = Object.values(blockedByRoom).flat();
  return mergeRanges(all);
}, [blockedByRoom]);

  const allImages = useMemo(() => {
    if (!room) return [];
    return [room.coverImage, ...(room.galleryImages || [])].filter(Boolean);
  }, [room]);

  if (!room) return null;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <ImageSlider images={allImages} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold">{room.name}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xl">₹{room.pricePerNight}/night</span>
          <div className="h-5 w-px bg-border" />
          <span className="text-xl">(₹{room.priceWithMeal}/night with meal)</span>
        </div>
      </div>

      <div className="text-gray-700">{room.description}</div>

      <div className="flex items-start justify-between gap-4">
        {/* LEFT: details */}
        <div className="w-full md:w-[64%] space-y-4">
          {!!room.roomServices?.length && (
            <div>
              <h3 className="font-semibold mb-2">Room services</h3>
              <div className="flex flex-wrap gap-2">
                {room.roomServices.map((s, i) => (
                  <span key={i} className="inline-flex items-center rounded-full border px-4 py-1 text-[16px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!room.accommodation?.length && (
            <div>
              <h3 className="font-semibold mb-2">Accommodation</h3>
              <ul className="list-disc pl-5 text-[16px] flex justify-between">
                {room.accommodation.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: booking card */}
        <div className="w-full md:w-[34%] shadow-lg border p-4 rounded-xl space-y-4">
          <CalendarRange value={range} onChange={setRange} disabledRanges={disabledAll} />


          <div>
            <label className="block text-sm mb-1">
              Guests (max {maxGuestsCap})
            </label>
            <Select value={guests} onValueChange={onGuestsChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select guests" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.max(1, maxGuestsCap) }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={goToCheckout} className="w-full">Book Now</Button>
        </div>
      </div>
    </div>
  );
}
