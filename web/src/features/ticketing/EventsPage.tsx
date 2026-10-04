import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Calendar, Ticket as TicketIcon, Music, Trophy, Users, Sparkles, Filter, ChevronRight } from "lucide-react";
import { fetchEvents, fetchTiers } from "./api";
import type { Event, TicketTier } from "./api";
import { EventBookingModal } from "./EventBookingModal";

const CATEGORIES = [
  { id: "all", label: "All Events", icon: Sparkles },
  { id: "Concert", label: "Concerts", icon: Music },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Conference", label: "Conferences", icon: Users },
  { id: "Festival", label: "Festivals", icon: Sparkles }
];

const CITIES = ["All Cities", "Dhaka", "Chittagong", "Sylhet"];

export function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookingEvent, setBookingEvent] = useState<Event | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents
  });

  const tiersQuery = useQuery({
    queryKey: ["ticketTiers"],
    queryFn: fetchTiers
  });

  const events = eventsQuery.data || [];
  const tiers = tiersQuery.data || [];

  const filteredEvents = events.filter((ev) => {
    const matchesCategory =
      selectedCategory === "all" || ev.Category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesCity = selectedCity === "All Cities" || ev.City.toLowerCase() === selectedCity.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      ev.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.VenueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.Organizer && ev.Organizer.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesCity && matchesSearch;
  });

  const getStartingPrice = (eventId?: string): number | null => {
    if (!eventId) return null;
    const eventTiers = tiers.filter((t) => t.EventId === eventId);
    if (!eventTiers.length) return null;
    return Math.min(...eventTiers.map((t) => t.Price));
  };

  const getEventTiers = (eventId?: string): TicketTier[] => {
    if (!eventId) return [];
    return tiers.filter((t) => t.EventId === eventId);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border border-[hsl(var(--border))] text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-purple-200">
            <Sparkles size={14} className="text-yellow-400" />
            <span>Official Ticketing Platform • Bangladesh</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Book Tickets for the Biggest Events in Bangladesh
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            From premier rock concerts and BPL cricket showdowns to tech summits. Verified digital tickets, instant bKash/Nagad checkout, and seamless entry.
          </p>

          {/* Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden p-1.5 focus-within:ring-2 focus-within:ring-purple-400">
              <Search className="ml-3 text-slate-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event, artist, or venue..."
                className="w-full bg-transparent px-3 py-2 text-white placeholder-slate-400 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="px-2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs & City Dropdown */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--muted-foreground))]"
                }`}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-[hsl(var(--muted-foreground))]" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {eventsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] animate-pulse p-4 space-y-4"
            >
              <div className="h-44 bg-[hsl(var(--muted))] rounded-xl" />
              <div className="h-6 w-3/4 bg-[hsl(var(--muted))] rounded" />
              <div className="h-4 w-1/2 bg-[hsl(var(--muted))] rounded" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <TicketIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">No events found</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            We couldn't find any events matching your selected filters. Try searching for a different keyword or selecting "All Events".
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSelectedCity("All Cities");
              setSearchQuery("");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const start = new Date(ev.StartDateTime);
            const dateStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const dayStr = start.toLocaleDateString("en-US", { weekday: "short" });
            const startPrice = getStartingPrice(ev.ItemId);

            return (
              <div
                key={ev.ItemId || ev.Title}
                className="group flex flex-col bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300"
              >
                {/* Banner image with date badge */}
                <div className="relative h-48 w-full bg-[hsl(var(--muted))] overflow-hidden">
                  <img
                    src={ev.BannerUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"}
                    alt={ev.Title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Date badge */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-center px-2.5 py-1 rounded-xl border border-white/10 shadow-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-300">{dayStr}</span>
                    <span className="block text-sm font-extrabold">{dateStr}</span>
                  </div>

                  {/* Category pill */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow">
                      {ev.Category}
                    </span>
                  </div>

                  {/* Venue location overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-center gap-1.5 text-xs drop-shadow">
                    <MapPin size={14} className="text-purple-300 shrink-0" />
                    <span className="truncate">{ev.VenueName}, {ev.City}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[hsl(var(--foreground))] group-hover:text-primary transition-colors line-clamp-1">
                      {ev.Title}
                    </h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mt-1.5 leading-relaxed">
                      {ev.Description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] block uppercase tracking-wider">
                        Starting from
                      </span>
                      <span className="text-base font-extrabold text-[hsl(var(--foreground))]">
                        {startPrice !== null ? `৳${startPrice.toLocaleString()} BDT` : "Free"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingEvent(ev)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1 shadow-md shadow-primary/20"
                    >
                      <span>Get Tickets</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {bookingEvent && (
        <EventBookingModal
          event={bookingEvent}
          tiers={getEventTiers(bookingEvent.ItemId)}
          onClose={() => setBookingEvent(null)}
          onBookingSuccess={() => {
            tiersQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
