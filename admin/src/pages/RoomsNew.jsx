import { useState } from "react";
import { createRoom } from "../api/admin";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function Chip({ text, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
      {text}
      <button type="button" className="opacity-70 hover:opacity-100" onClick={onRemove}>✕</button>
    </span>
  );
}

export default function RoomsNew() {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [priceWithMeal, setPriceWithMeal] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [galleryText, setGalleryText] = useState(""); // one URL per line
  const galleryList = galleryText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const [description, setDescription] = useState("");

  const [services, setServices] = useState([]); // chips
  const [serviceInput, setServiceInput] = useState("");

  const [accoms, setAccoms] = useState([]); // chips
  const [accomInput, setAccomInput] = useState("");

  const addService = () => {
    const v = serviceInput.trim();
    if (!v) return;
    setServices((arr) => (arr.includes(v) ? arr : [...arr, v]));
    setServiceInput("");
  };
  const removeService = (v) => setServices((arr) => arr.filter((x) => x !== v));

  const addAccom = () => {
    const v = accomInput.trim();
    if (!v) return;
    setAccoms((arr) => (arr.includes(v) ? arr : [...arr, v]));
    setAccomInput("");
  };
  const removeAccom = (v) => setAccoms((arr) => arr.filter((x) => x !== v));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // basic validation
    if (!name.trim()) return toast.error("Room name is required");
    if (pricePerNight === "" || isNaN(Number(pricePerNight)))
      return toast.error("Enter a valid price per night");

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        pricePerNight: Number(pricePerNight) || 0,
        priceWithMeal: Number(priceWithMeal) || 0,
        coverImage,
        galleryImages: galleryList,
        description,
        roomServices: services,
        accommodation: accoms,
      };

      const created = await toast.promise(createRoom(payload), {
        loading: "Creating room...",
        success: "Room created",
        error: (err) => err?.response?.data?.message || err.message || "Failed to create room",
      });

      // reset form
      setName("");
      setPricePerNight("");
      setPriceWithMeal("");
      setCoverImage("");
      setGalleryText("");
      setDescription("");
      setServices([]);
      setServiceInput("");
      setAccoms([]);
      setAccomInput("");

      console.log("Created room:", created);
    } catch {
      /* toast handled above */
    } finally {
      setLoading(false);
    }
  };

  const onServiceKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addService();
    }
  };
  const onAccomKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAccom();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-semibold">Create Room</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap gap-4">
        {/* Room name */}
        <div className="w-[33%]">
          <Label>Room name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Grand Repose" />
        </div>

        {/* Pricing */}
        <div className="flex gap-4 w-[65.5%]">
          <div className="w-[49%]">
            <Label>Price per night (₹)</Label>
            <Input
              type="number"
              min="0"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              placeholder="e.g., 4500"
            />
          </div>
          <div className="w-[49%]">
            <Label>Price with meal (₹)</Label>
            <Input
              type="number"
              min="0"
              value={priceWithMeal}
              onChange={(e) => setPriceWithMeal(e.target.value)}
              placeholder="e.g., 5500"
            />
          </div>
        </div>

         {/* Room services (chips) */}
        <div className="w-[49.2%]">
          <Label>Room services</Label>
          <div className="flex gap-2">
            <Input
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyDown={onServiceKey}
              placeholder="Type a service and press Enter (e.g., Free Wi-Fi)"
            />
            <Button type="button" onClick={addService} variant="secondary">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <Chip key={s} text={s} onRemove={() => removeService(s)} />
            ))}
          </div>
        </div>

        {/* Accommodation (chips) */}
        <div className="w-[49.2%]">
          <Label>Accommodation</Label>
          <div className="flex gap-2">
            <Input
              value={accomInput}
              onChange={(e) => setAccomInput(e.target.value)}
              onKeyDown={onAccomKey}
              placeholder="Type an accommodation and press Enter (e.g., 2 Adults)"
            />
            <Button type="button" onClick={addAccom} variant="secondary">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {accoms.map((a) => (
              <Chip key={a} text={a} onRemove={() => removeAccom(a)} />
            ))}
          </div>
        </div>

         {/* Images */}
        <div className="w-[100%]">
          <Label>Cover image URL</Label>
          <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
        </div>

        <div className="w-[49.2%]">
          <Label>Gallery images (one URL per line)</Label>
          <Textarea
            rows={4}
            value={galleryText}
            onChange={(e) => setGalleryText(e.target.value)}
            placeholder={"https://...\nhttps://...\nhttps://..."}
          />
          {galleryList.length > 0 && (
            <p className="text-xs text-gray-500">{galleryList.length} links detected</p>
          )}
        </div>

        {/* Description */}
        <div className="w-[49.2%]">
          <Label>Description</Label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the room, view, amenities…"
          />
        </div>

       

        <Button disabled={loading} type="submit" className="w-full">
          {loading ? "Creating..." : "Create Room"}
        </Button>
      </form>
    </div>
  );
}
