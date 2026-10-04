import { blocksClient } from "../../lib/blocks/client";

export interface Event {
  ItemId?: string;
  Title: string;
  Slug?: string;
  Description: string;
  Category: string;
  Organizer?: string;
  VenueName: string;
  VenueAddress?: string;
  City: string;
  StartDateTime: string;
  EndDateTime?: string;
  BannerUrl?: string;
  Status: string;
  IsFeatured?: boolean;
}

export interface TicketTier {
  ItemId?: string;
  EventId: string;
  Name: string;
  Description?: string;
  Price: number;
  Currency: string;
  TotalQuantity: number;
  AvailableQuantity: number;
  MaxPerBooking: number;
  SalesStart?: string;
  SalesEnd?: string;
  Status: string;
}

export interface Booking {
  ItemId?: string;
  BookingNumber: string;
  EventId: string;
  UserId?: string;
  CustomerName: string;
  CustomerEmail: string;
  CustomerPhone: string;
  TotalAmount: number;
  TotalTickets: number;
  Status: string;
  PaymentStatus: string;
  PaymentMethod: string;
  PaymentTransactionId?: string;
  PaidAt?: string;
  CreatedDate?: string;
}

export interface Ticket {
  ItemId?: string;
  TicketCode: string;
  BookingId: string;
  EventId: string;
  TicketTierId: string;
  AttendeeName: string;
  AttendeeEmail?: string;
  SeatNumber?: string;
  Price: number;
  Status: string;
  CheckInTime?: string;
  CheckInGate?: string;
}

export interface Venue {
  ItemId?: string;
  Name: string;
  Address: string;
  City: string;
  Capacity?: number;
  ContactPhone?: string;
  GoogleMapsUrl?: string;
}

const eventsCollection = blocksClient.data.collection<Event>("Event", {
  fields: [
    "Title",
    "Slug",
    "Description",
    "Category",
    "Organizer",
    "VenueName",
    "VenueAddress",
    "City",
    "StartDateTime",
    "EndDateTime",
    "BannerUrl",
    "Status",
    "IsFeatured"
  ]
});

const tiersCollection = blocksClient.data.collection<TicketTier>("TicketTier", {
  fields: [
    "EventId",
    "Name",
    "Description",
    "Price",
    "Currency",
    "TotalQuantity",
    "AvailableQuantity",
    "MaxPerBooking",
    "SalesStart",
    "SalesEnd",
    "Status"
  ]
});

const bookingsCollection = blocksClient.data.collection<Booking>("Booking", {
  fields: [
    "BookingNumber",
    "EventId",
    "UserId",
    "CustomerName",
    "CustomerEmail",
    "CustomerPhone",
    "TotalAmount",
    "TotalTickets",
    "Status",
    "PaymentStatus",
    "PaymentMethod",
    "PaymentTransactionId",
    "PaidAt"
  ]
});

const ticketsCollection = blocksClient.data.collection<Ticket>("Ticket", {
  fields: [
    "TicketCode",
    "BookingId",
    "EventId",
    "TicketTierId",
    "AttendeeName",
    "AttendeeEmail",
    "SeatNumber",
    "Price",
    "Status",
    "CheckInTime",
    "CheckInGate"
  ]
});

const venuesCollection = blocksClient.data.collection<Venue>("Venue", {
  fields: ["Name", "Address", "City", "Capacity", "ContactPhone", "GoogleMapsUrl"]
});

export async function fetchEvents(): Promise<Event[]> {
  const res: any = await eventsCollection.list({ pageNo: 1, pageSize: 50 });
  return res?.data?.getEvents?.items || [];
}

export async function fetchTiers(): Promise<TicketTier[]> {
  const res: any = await tiersCollection.list({ pageNo: 1, pageSize: 100 });
  return res?.data?.getTicketTiers?.items || [];
}

export async function fetchVenues(): Promise<Venue[]> {
  const res: any = await venuesCollection.list({ pageNo: 1, pageSize: 50 });
  return res?.data?.getVenues?.items || [];
}

export async function fetchBookings(): Promise<Booking[]> {
  const res: any = await bookingsCollection.list({ pageNo: 1, pageSize: 100 });
  return res?.data?.getBookings?.items || [];
}

export async function fetchTickets(): Promise<Ticket[]> {
  const res: any = await ticketsCollection.list({ pageNo: 1, pageSize: 200 });
  return res?.data?.getTickets?.items || [];
}

export interface CreateBookingParams {
  event: Event;
  tier: TicketTier;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  userId?: string;
}

export interface BookingResult {
  booking: Booking;
  tickets: Ticket[];
}

export async function createBookingTransaction(params: CreateBookingParams): Promise<BookingResult> {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const bookingNumber = `BDT-${dateStr}-${randomSuffix}`;
  const totalAmount = params.tier.Price * params.quantity;
  const transactionId = `TXN-${params.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const bookingPayload: Booking = {
    BookingNumber: bookingNumber,
    EventId: params.event.ItemId || "",
    UserId: params.userId || "guest",
    CustomerName: params.customerName,
    CustomerEmail: params.customerEmail,
    CustomerPhone: params.customerPhone,
    TotalAmount: totalAmount,
    TotalTickets: params.quantity,
    Status: "Confirmed",
    PaymentStatus: "Paid",
    PaymentMethod: params.paymentMethod,
    PaymentTransactionId: transactionId,
    PaidAt: now.toISOString()
  };

  const bookingRes: any = await bookingsCollection.create(bookingPayload);
  const bookingId = bookingRes?.data?.insertBooking?.itemId || `local-${Date.now()}`;
  bookingPayload.ItemId = bookingId;

  // Create individual tickets
  const createdTickets: Ticket[] = [];
  for (let i = 1; i <= params.quantity; i++) {
    const ticketCode = `TKT-${params.event.Title.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const ticketPayload: Ticket = {
      TicketCode: ticketCode,
      BookingId: bookingId,
      EventId: params.event.ItemId || "",
      TicketTierId: params.tier.ItemId || "",
      AttendeeName: `${params.customerName} (${i}/${params.quantity})`,
      AttendeeEmail: params.customerEmail,
      SeatNumber: `${params.tier.Name} - Entry #${i}`,
      Price: params.tier.Price,
      Status: "Issued"
    };

    try {
      const ticketRes: any = await ticketsCollection.create(ticketPayload);
      ticketPayload.ItemId = ticketRes?.data?.insertTicket?.itemId;
    } catch {
      // If collection creates, save payload
    }
    createdTickets.push(ticketPayload);
  }

  // Update tier available quantity if tier has an ItemId
  if (params.tier.ItemId) {
    const newQty = Math.max(0, params.tier.AvailableQuantity - params.quantity);
    try {
      await tiersCollection.update(params.tier.ItemId, {
        AvailableQuantity: newQty,
        Status: newQty === 0 ? "SoldOut" : "Active"
      });
    } catch (err) {
      console.warn("Failed to update tier inventory:", err);
    }
  }

  return {
    booking: bookingPayload,
    tickets: createdTickets
  };
}

export async function createNewEvent(
  eventData: Omit<Event, "ItemId">,
  tiers: Array<Omit<TicketTier, "ItemId" | "EventId">>
): Promise<string> {
  const eventRes: any = await eventsCollection.create(eventData);
  const eventId = eventRes?.data?.insertEvent?.itemId;

  if (!eventId) throw new Error("Failed to retrieve created Event ID");

  for (const tier of tiers) {
    await tiersCollection.create({
      ...tier,
      EventId: eventId
    });
  }

  return eventId;
}

export async function verifyAndCheckInTicket(ticketCode: string, gate = "Main Gate"): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  const tickets = await fetchTickets();
  const found = tickets.find((t) => t.TicketCode.trim().toLowerCase() === ticketCode.trim().toLowerCase());

  if (!found) {
    return { success: false, message: `Ticket with code "${ticketCode}" was not found.` };
  }

  if (found.Status === "CheckedIn") {
    return {
      success: false,
      message: `Already checked in at ${found.CheckInTime ? new Date(found.CheckInTime).toLocaleTimeString() : "earlier"} at ${found.CheckInGate || "gate"}.`,
      ticket: found
    };
  }

  if (found.Status === "Cancelled") {
    return { success: false, message: "This ticket has been cancelled.", ticket: found };
  }

  const updatedTime = new Date().toISOString();
  if (found.ItemId) {
    await ticketsCollection.update(found.ItemId, {
      Status: "CheckedIn",
      CheckInTime: updatedTime,
      CheckInGate: gate
    });
  }

  return {
    success: true,
    message: `Check-in successful for ${found.AttendeeName}!`,
    ticket: {
      ...found,
      Status: "CheckedIn",
      CheckInTime: updatedTime,
      CheckInGate: gate
    }
  };
}
