import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket as TicketIcon, Search, Calendar, MapPin, CheckCircle, AlertCircle, Printer, Download, Sparkles } from "lucide-react";
import { fetchTickets, fetchBookings, fetchEvents } from "./api";
import type { Ticket, Booking, Event } from "./api";
import { useT } from "../../lib/i18n/LocalizationProvider";

export function MyTicketsPage() {
  const { t } = useT();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: fetchTickets });
  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings });
  const eventsQuery = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const tickets = ticketsQuery.data || [];
  const bookings = bookingsQuery.data || [];
  const events = eventsQuery.data || [];

  const bookingsMap = new Map<string, Booking>();
  bookings.forEach((b) => {
    if (b.ItemId) bookingsMap.set(b.ItemId, b);
  });

  const eventsMap = new Map<string, Event>();
  events.forEach((e) => {
    if (e.ItemId) eventsMap.set(e.ItemId, e);
  });

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const booking = bookingsMap.get(ticket.BookingId);

    return (
      ticket.TicketCode.toLowerCase().includes(q) ||
      ticket.AttendeeName.toLowerCase().includes(q) ||
      (ticket.AttendeeEmail && ticket.AttendeeEmail.toLowerCase().includes(q)) ||
      (booking && booking.BookingNumber.toLowerCase().includes(q)) ||
      (booking && booking.CustomerPhone.includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))] tracking-tight">
          {t("myTickets.title")}
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {t("myTickets.subtitle")}
        </p>
      </div>

      {/* Search Filter */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 shadow-sm">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-3.5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("myTickets.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              {t("events.clear")}
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      {ticketsQuery.isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <TicketIcon size={28} />
          </div>
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{t("myTickets.noTicketsTitle")}</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
            {searchQuery
              ? `No tickets match "${searchQuery}". Please check your code or phone number.`
              : t("myTickets.noTicketsSubtitle")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTickets.map((ticket) => {
            const booking = bookingsMap.get(ticket.BookingId);
            const event = eventsMap.get(ticket.EventId);
            const isCheckedIn = ticket.Status === "CheckedIn";
            const isCancelled = ticket.Status === "Cancelled";

            const eventStart = event?.StartDateTime ? new Date(event.StartDateTime) : null;
            const dateStr = eventStart
              ? eventStart.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
              : "TBA";
            const timeStr = eventStart
              ? eventStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div
                key={ticket.ItemId || ticket.TicketCode}
                className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row transition-all hover:border-primary/40"
              >
                {/* Main Pass Info */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary mb-1">
                        {event?.Category || "Event Pass"}
                      </span>
                      <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">
                        {event?.Title || "Event Admission"}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isCheckedIn
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                          : isCancelled
                          ? "bg-red-500/10 text-red-500 border border-red-500/30"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                      }`}
                    >
                      {isCheckedIn ? <CheckCircle size={12} /> : <Sparkles size={12} />}
                      <span>{isCheckedIn ? t("myTickets.checkedIn") : isCancelled ? t("myTickets.cancelled") : t("myTickets.validEntry")}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-primary" />
                      <span>{dateStr} {timeStr && `• ${timeStr}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-primary" />
                      <span className="truncate">{event?.VenueName || "Venue"}, {event?.City || "Bangladesh"}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[hsl(var(--border))] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-[hsl(var(--muted-foreground))] block">{t("myTickets.attendee")}</span>
                      <span className="font-semibold text-sm text-[hsl(var(--foreground))]">{ticket.AttendeeName}</span>
                    </div>

                    <div>
                      <span className="text-[hsl(var(--muted-foreground))] block">{t("myTickets.categoryTier")}</span>
                      <span className="font-semibold text-sm text-primary">{ticket.SeatNumber || "Standard"}</span>
                    </div>

                    {booking && (
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))] block">{t("myTickets.bookingRef")}</span>
                        <span className="font-mono font-medium text-[hsl(var(--foreground))]">{booking.BookingNumber}</span>
                      </div>
                    )}

                    <div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="p-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] flex items-center gap-1.5 transition-colors"
                        title="Print / Save Pass"
                      >
                        <Printer size={14} />
                        <span className="text-xs font-medium">{t("myTickets.print")}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stub / Barcode Section */}
                <div className="bg-[hsl(var(--muted))] p-6 md:w-56 border-t md:border-t-0 md:border-l border-dashed border-[hsl(var(--border))] flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-full flex justify-center">
                    {/* Simulated barcode graphic */}
                    <div className="h-14 w-40 flex items-center justify-between px-2 bg-white rounded border border-slate-200">
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2].map((w, idx) => (
                        <div key={idx} className="h-10 bg-slate-900" style={{ width: `${w * 2}px` }} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--muted-foreground))]">
                      {t("myTickets.passCode")}
                    </span>
                    <span className="font-mono text-xs font-black tracking-wider text-[hsl(var(--foreground))]">
                      {ticket.TicketCode}
                    </span>
                  </div>

                  {ticket.CheckInTime && (
                    <span className="text-[10px] text-blue-500 font-medium block">
                      {t("myTickets.gate")}: {ticket.CheckInGate || "Main"} • {new Date(ticket.CheckInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
