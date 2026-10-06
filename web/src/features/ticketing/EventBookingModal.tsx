import { useState } from "react";
import { Calendar, MapPin, Ticket as TicketIcon, CheckCircle2, AlertCircle, Loader2, CreditCard, ArrowRight, ShieldCheck } from "lucide-react";
import type { Event, TicketTier, BookingResult } from "./api";
import { createBookingTransaction } from "./api";
import { useT } from "../../lib/i18n/LocalizationProvider";

interface EventBookingModalProps {
  event: Event;
  tiers: TicketTier[];
  onClose: () => void;
  onBookingSuccess?: (result: BookingResult) => void;
}

export function EventBookingModal({ event, tiers, onClose, onBookingSuccess }: EventBookingModalProps) {
  const { t } = useT();
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.ItemId || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bKash");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<BookingResult | null>(null);

  const selectedTier = tiers.find((t) => t.ItemId === selectedTierId) || tiers[0];
  const totalPrice = selectedTier ? selectedTier.Price * quantity : 0;

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTier) {
      setError("Please select a ticket tier.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and mobile number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createBookingTransaction({
        event,
        tier: selectedTier,
        quantity,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        paymentMethod
      });

      setSuccessResult(result);
      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process booking.");
    } finally {
      setSubmitting(false);
    }
  }

  const startDateFormatted = new Date(event.StartDateTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const startTimeFormatted = new Date(event.StartDateTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header with image */}
        <div className="relative h-44 w-full bg-gradient-to-r from-purple-900 to-indigo-900 overflow-hidden">
          {event.BannerUrl && (
            <img
              src={event.BannerUrl}
              alt={event.Title}
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--card))] via-transparent to-black/30" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors text-lg font-bold"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground mb-2">
              {event.Category}
            </span>
            <h2 className="text-2xl font-bold text-white drop-shadow-md leading-tight">{event.Title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {successResult ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))]">{t("booking.confirmed")}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  {t("booking.confirmedSubtitle")}
                </p>
              </div>

              <div className="bg-[hsl(var(--muted))] p-4 rounded-xl text-left border border-[hsl(var(--border))] space-y-2">
                <div className="flex justify-between items-center text-sm pb-2 border-b border-[hsl(var(--border))]">
                  <span className="text-[hsl(var(--muted-foreground))]">{t("booking.reference")}</span>
                  <span className="font-mono font-bold text-primary">{successResult.booking.BookingNumber}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">{t("booking.customer")}</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{successResult.booking.CustomerName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">{t("booking.totalPaid")}</span>
                  <span className="font-bold text-[hsl(var(--foreground))]">৳{successResult.booking.TotalAmount.toLocaleString()} BDT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">{t("booking.paymentMethod")}</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{successResult.booking.PaymentMethod}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-left text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                  {t("booking.issuedTickets")} ({successResult.tickets.length})
                </h4>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {successResult.tickets.map((tkt, idx) => (
                    <div
                      key={tkt.TicketCode || idx}
                      className="p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <TicketIcon size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))] font-mono">{tkt.TicketCode}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{tkt.SeatNumber}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                        {t("booking.validPass")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  {t("booking.done")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-6">
              {/* Event meta pills */}
              <div className="flex flex-wrap gap-4 text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))] pb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-primary" />
                  <span>{startDateFormatted} at {startTimeFormatted}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-primary" />
                  <span>{event.VenueName}, {event.City}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                  {t("booking.modalTitle")}
                </label>
                <div className="grid gap-2.5">
                  {tiers.map((tier) => {
                    const isSelected = (tier.ItemId || tier.Name) === selectedTierId;
                    const isSoldOut = tier.AvailableQuantity <= 0 || tier.Status === "SoldOut";

                    return (
                      <div
                        key={tier.ItemId || tier.Name}
                        onClick={() => {
                          if (!isSoldOut) {
                            setSelectedTierId(tier.ItemId || tier.Name);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : isSoldOut
                            ? "opacity-50 border-[hsl(var(--border))] cursor-not-allowed bg-[hsl(var(--muted))]"
                            : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))]"
                        }`}
                      >
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">{tier.Name}</span>
                            {tier.AvailableQuantity > 0 && tier.AvailableQuantity < 50 && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-medium">
                                {t("booking.onlyLeft")} {tier.AvailableQuantity}
                              </span>
                            )}
                          </div>
                          {tier.Description && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm line-clamp-1">
                              {tier.Description}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-primary">৳{tier.Price.toLocaleString()}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))] block">BDT</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between p-3.5 bg-[hsl(var(--muted))] rounded-xl">
                <div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{t("booking.numTickets")}</span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("booking.maxPerBooking")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="h-8 w-8 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center font-bold text-base disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-base font-bold w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedTier?.MaxPerBooking || 6, q + 1))}
                    disabled={quantity >= (selectedTier?.MaxPerBooking || 6)}
                    className="h-8 w-8 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center font-bold text-base disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{t("booking.yourDetails")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">{t("booking.fullName")}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("booking.fullNamePlaceholder")}
                      className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">{t("booking.email")}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("booking.emailPlaceholder")}
                      className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">{t("booking.phone")}</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                  {t("booking.selectPayment")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bKash", name: "bKash", color: "bg-pink-500/10 border-pink-500/40 text-pink-600" },
                    { id: "Nagad", name: "Nagad", color: "bg-orange-500/10 border-orange-500/40 text-orange-600" },
                    { id: "Card", name: "Visa / Card", color: "bg-blue-500/10 border-blue-500/40 text-blue-600" }
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-3 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === pm.id
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                      }`}
                    >
                      <CreditCard size={18} />
                      <span>{pm.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary and Pay */}
              <div className="pt-2 border-t border-[hsl(var(--border))] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] block">{t("booking.totalPayable")}</span>
                  <span className="text-2xl font-bold text-primary">৳{totalPrice.toLocaleString()} BDT</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    {t("booking.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{t("booking.processing")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("booking.pay")} ৳{totalPrice.toLocaleString()}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>{t("booking.secureNotice")}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
