import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, QrCode, ClipboardList, CheckCircle2, AlertCircle, Loader2, DollarSign, Users, Ticket as TicketIcon } from "lucide-react";
import { fetchEvents, fetchBookings, fetchTickets, fetchVenues, createNewEvent, verifyAndCheckInTicket } from "./api";
import type { Event, TicketTier } from "./api";

export function OrganizerPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "create" | "bookings">("scanner");

  // Scanner state
  const [scanCode, setScanCode] = useState<string>("");
  const [gate, setGate] = useState<string>("Main Entrance");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);

  // Create Event state
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("Concert");
  const [organizer, setOrganizer] = useState<string>("");
  const [venueName, setVenueName] = useState<string>("");
  const [venueAddress, setVenueAddress] = useState<string>("");
  const [city, setCity] = useState<string>("Dhaka");
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Tiers for new event
  const [tiers, setTiers] = useState<Array<{ name: string; price: number; quantity: number; description: string }>>([
    { name: "General Admission", price: 500, quantity: 1000, description: "Standard entry pass" }
  ]);
  const [creating, setCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings });
  const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: fetchTickets });
  const venuesQuery = useQuery({ queryKey: ["venues"], queryFn: fetchVenues });

  const events = eventsQuery.data || [];
  const bookings = bookingsQuery.data || [];
  const tickets = ticketsQuery.data || [];

  // Summary statistics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.TotalAmount || 0), 0);
  const totalTicketsSold = bookings.reduce((sum, b) => sum + (b.TotalTickets || 0), 0);
  const checkedInCount = tickets.filter((t) => t.Status === "CheckedIn").length;

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!scanCode.trim()) return;

    setCheckingIn(true);
    setScanResult(null);

    try {
      const result = await verifyAndCheckInTicket(scanCode.trim(), gate);
      setScanResult(result);
      if (result.success) {
        setScanCode("");
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }
    } catch (err: unknown) {
      setScanResult({
        success: false,
        message: err instanceof Error ? err.message : "Check-in service error."
      });
    } finally {
      setCheckingIn(false);
    }
  }

  function addTierRow() {
    setTiers([...tiers, { name: "", price: 1000, quantity: 500, description: "" }]);
  }

  function removeTierRow(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !venueName.trim() || !startDateTime) {
      setCreateError("Please complete all required event fields.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const eventData: Omit<Event, "ItemId"> = {
        Title: title.trim(),
        Slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        Description: description.trim(),
        Category: category,
        Organizer: organizer.trim() || "Event Authority",
        VenueName: venueName.trim(),
        VenueAddress: venueAddress.trim() || venueName.trim(),
        City: city,
        StartDateTime: new Date(startDateTime).toISOString(),
        EndDateTime: endDateTime ? new Date(endDateTime).toISOString() : new Date(startDateTime).toISOString(),
        BannerUrl: bannerUrl.trim() || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
        Status: "Published",
        IsFeatured: false
      };

      const tierData: Array<Omit<TicketTier, "ItemId" | "EventId">> = tiers.map((t) => ({
        Name: t.name || "General Admission",
        Price: Number(t.price) || 0,
        Currency: "BDT",
        TotalQuantity: Number(t.quantity) || 100,
        AvailableQuantity: Number(t.quantity) || 100,
        MaxPerBooking: 6,
        Status: "Active",
        Description: t.description || ""
      }));

      await createNewEvent(eventData, tierData);

      setCreateSuccess(`Event "${title}" and ${tiers.length} tier(s) created and published successfully!`);
      setTitle("");
      setDescription("");
      setOrganizer("");
      setVenueName("");
      setStartDateTime("");
      setEndDateTime("");
      setBannerUrl("");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["ticketTiers"] });
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
          Organizer & Gate Portal
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Manage event ticketing, scan attendee passes, and inspect real-time sales.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">Total Revenue</span>
            <p className="text-2xl font-black text-[hsl(var(--foreground))]">৳{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <TicketIcon size={24} />
          </div>
          <div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">Tickets Sold</span>
            <p className="text-2xl font-black text-[hsl(var(--foreground))]">{totalTicketsSold}</p>
          </div>
        </div>

        <div className="p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-semibold">Checked-In Guests</span>
            <p className="text-2xl font-black text-[hsl(var(--foreground))]">{checkedInCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("scanner")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "scanner"
              ? "border-primary text-primary"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <QrCode size={18} />
          <span>Gate Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "create"
              ? "border-primary text-primary"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <PlusCircle size={18} />
          <span>Create New Event</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "bookings"
              ? "border-primary text-primary"
              : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          }`}
        >
          <ClipboardList size={18} />
          <span>Bookings & Orders ({bookings.length})</span>
        </button>
      </div>

      {/* Tab 1: Scanner */}
      {activeTab === "scanner" && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 sm:p-8 max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <QrCode size={24} />
            </div>
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Fast Check-In Scanner</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Scan barcode or enter the Ticket Pass Code to verify attendee entry.
            </p>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">
                Entrance Gate
              </label>
              <select
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              >
                <option value="Main Entrance">Main Entrance Gate</option>
                <option value="VIP Gate A">VIP Gate A</option>
                <option value="Gallery Gate 2">Gallery Gate 2</option>
                <option value="Media & Crew Gate">Media & Crew Gate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">
                Ticket Code
              </label>
              <input
                type="text"
                required
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                placeholder="e.g. TKT-DHA-7X9K2"
                className="w-full px-4 py-3 bg-[hsl(var(--background))] border-2 border-primary/40 focus:border-primary rounded-xl text-lg font-mono tracking-widest text-center uppercase focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={checkingIn || !scanCode.trim()}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {checkingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Validate & Check In</span>
              )}
            </button>
          </form>

          {scanResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                scanResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                  : "bg-red-500/10 border-red-500/30 text-red-600"
              }`}
            >
              {scanResult.success ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
              <div className="text-sm font-medium">{scanResult.message}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create Event */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateEvent} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Publish New Event</h2>

          {createSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{createSuccess}</span>
            </div>
          )}

          {createError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dhaka Fusion Night 2026"
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              >
                <option value="Concert">Concert</option>
                <option value="Sports">Sports</option>
                <option value="Conference">Conference</option>
                <option value="Festival">Festival</option>
                <option value="Theater">Theater</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Venue Name *</label>
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Army Stadium"
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Organizer Name</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="e.g. Bangladesh Rock Association"
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Banner Image URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event summary, performing artists, lineup, and rules..."
                className="w-full px-3 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Ticket Tiers */}
          <div className="space-y-3 pt-4 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Ticket Categories / Tiers</h3>
              <button
                type="button"
                onClick={addTierRow}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <PlusCircle size={14} />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <div>
                    <label className="block text-[10px] text-[hsl(var(--muted-foreground))]">Tier Name</label>
                    <input
                      type="text"
                      required
                      value={tier.name}
                      onChange={(e) => {
                        const copy = [...tiers];
                        if (copy[idx]) {
                          copy[idx] = { ...copy[idx]!, name: e.target.value };
                          setTiers(copy);
                        }
                      }}
                      placeholder="e.g. VIP Pass"
                      className="w-full px-2.5 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[hsl(var(--muted-foreground))]">Price (BDT)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={tier.price}
                      onChange={(e) => {
                        const copy = [...tiers];
                        if (copy[idx]) {
                          copy[idx] = { ...copy[idx]!, price: Number(e.target.value) };
                          setTiers(copy);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[hsl(var(--muted-foreground))]">Total Capacity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={tier.quantity}
                      onChange={(e) => {
                        const copy = [...tiers];
                        if (copy[idx]) {
                          copy[idx] = { ...copy[idx]!, quantity: Number(e.target.value) };
                          setTiers(copy);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3 sm:pt-0">
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTierRow(idx)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>Publish Event to Blocks Data Gateway</span>
          </button>
        </form>
      )}

      {/* Tab 3: Bookings */}
      {activeTab === "bookings" && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Tickets</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[hsl(var(--muted-foreground))]">
                      No bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.ItemId || b.BookingNumber} className="hover:bg-[hsl(var(--muted))]/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{b.BookingNumber}</td>
                      <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{b.CustomerName}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        <div>{b.CustomerPhone}</div>
                        <div className="text-[10px] truncate max-w-[120px]">{b.CustomerEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-bold">{b.TotalTickets}</td>
                      <td className="px-4 py-3 font-extrabold text-[hsl(var(--foreground))]">৳{b.TotalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                          {b.PaymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          {b.Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
