import { createBlocksClient } from "@seliseblocks/client";

const blocks = createBlocksClient({
  apiUrl: "https://blocksapi.slsblx.com",
  xBlocksKey: "Dac77f335ac654872b6f8b49f76e18d7b"
});

const venuesCol = blocks.data.collection("Venue", {
  fields: ["Name", "City", "Address", "Capacity", "ContactPhone", "GoogleMapsUrl"]
});

const eventsCol = blocks.data.collection("Event", {
  fields: ["Title", "Slug", "Description", "Category", "Organizer", "VenueName", "VenueAddress", "City", "StartDateTime", "EndDateTime", "BannerUrl", "Status", "IsFeatured"]
});

const tiersCol = blocks.data.collection("TicketTier", {
  fields: ["EventId", "Name", "Description", "Price", "Currency", "TotalQuantity", "AvailableQuantity", "MaxPerBooking", "SalesStart", "SalesEnd", "Status"]
});

async function main() {
  console.log("Seeding venues...");
  const v1 = await venuesCol.create({
    Name: "ICCB - Hall 4",
    Address: "Kuril Bishwa Road, Purbachal Expressway, Dhaka",
    City: "Dhaka",
    Capacity: 5000,
    ContactPhone: "+8801700112233",
    GoogleMapsUrl: "https://maps.google.com/?q=ICCB+Dhaka"
  });
  const iccbId = v1.data?.insertVenue?.itemId;

  const v2 = await venuesCol.create({
    Name: "M. A. Aziz Stadium",
    Address: "Stadium Road, Kazir Dewri, Chittagong",
    City: "Chittagong",
    Capacity: 20000,
    ContactPhone: "+8801811223344",
    GoogleMapsUrl: "https://maps.google.com/?q=MA+Aziz+Stadium+Chittagong"
  });
  const ctgId = v2.data?.insertVenue?.itemId;

  console.log("Seeding events...");

  // Event 1: Dhaka Rock Fest
  const e1 = await eventsCol.create({
    Title: "Dhaka Rock Fest 2026",
    Slug: "dhaka-rock-fest-2026",
    Description: "The biggest rock and metal music celebration in Bangladesh featuring top headline bands: Artcell, Warfaze, Shironamhin, Aurthohin, Nemesis, and AvoidRafa. Experience electrifying live performances, world-class light and sound, and festival food zones.",
    Category: "Concert",
    Organizer: "Live Square & RockNation BD",
    VenueName: "Army Stadium",
    VenueAddress: "Airport Road, Cantonment",
    City: "Dhaka",
    StartDateTime: "2026-11-15T15:00:00.000Z",
    EndDateTime: "2026-11-15T23:00:00.000Z",
    BannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    Status: "Published",
    IsFeatured: true
  });
  const e1Id = e1.data?.insertEvent?.itemId;
  console.log("Created Event 1:", e1Id);

  await tiersCol.create({
    EventId: e1Id,
    Name: "VIP Front Stage",
    Description: "Exclusive front stage moshpit access, backstage lounge pass, complimentary energy drinks & band merchandise.",
    Price: 2500,
    Currency: "BDT",
    TotalQuantity: 500,
    AvailableQuantity: 480,
    MaxPerBooking: 4,
    SalesStart: "2026-10-01T00:00:00.000Z",
    SalesEnd: "2026-11-14T23:59:00.000Z",
    Status: "Active"
  });

  await tiersCol.create({
    EventId: e1Id,
    Name: "Fan Zone",
    Description: "Center standing area with clear sightlines to main stage and dedicated beverage counters.",
    Price: 1200,
    Currency: "BDT",
    TotalQuantity: 2000,
    AvailableQuantity: 1850,
    MaxPerBooking: 6,
    SalesStart: "2026-10-01T00:00:00.000Z",
    SalesEnd: "2026-11-14T23:59:00.000Z",
    Status: "Active"
  });

  await tiersCol.create({
    EventId: e1Id,
    Name: "General Admission",
    Description: "Standard admission with full ground access and festival zone entry.",
    Price: 600,
    Currency: "BDT",
    TotalQuantity: 5000,
    AvailableQuantity: 4600,
    MaxPerBooking: 10,
    SalesStart: "2026-10-01T00:00:00.000Z",
    SalesEnd: "2026-11-15T12:00:00.000Z",
    Status: "Active"
  });

  // Event 2: BPL Cricket
  const e2 = await eventsCol.create({
    Title: "BPL T20: Dhaka Dominators vs Chittagong Kings",
    Slug: "bpl-dhaka-vs-chittagong",
    Description: "High-octane cricket rivalry clash under floodlights. Catch your favorite national and international cricket superstars battle in this crucial qualifier match.",
    Category: "Sports",
    Organizer: "Bangladesh Cricket Board (BCB)",
    VenueName: "M. A. Aziz Stadium",
    VenueAddress: "Kazir Dewri",
    City: "Chittagong",
    StartDateTime: "2026-12-05T18:00:00.000Z",
    EndDateTime: "2026-12-05T22:30:00.000Z",
    BannerUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
    Status: "Published",
    IsFeatured: true
  });
  const e2Id = e2.data?.insertEvent?.itemId;
  console.log("Created Event 2:", e2Id);

  await tiersCol.create({
    EventId: e2Id,
    Name: "Grand Stand VIP",
    Description: "Air-conditioned corporate hospitality box with buffet dinner and premium pitch view.",
    Price: 1500,
    Currency: "BDT",
    TotalQuantity: 300,
    AvailableQuantity: 260,
    MaxPerBooking: 4,
    SalesStart: "2026-10-05T00:00:00.000Z",
    SalesEnd: "2026-12-04T23:59:00.000Z",
    Status: "Active"
  });

  await tiersCol.create({
    EventId: e2Id,
    Name: "Club House Upper",
    Description: "Covered seating with shaded view along the straight boundary.",
    Price: 800,
    Currency: "BDT",
    TotalQuantity: 1500,
    AvailableQuantity: 1200,
    MaxPerBooking: 6,
    SalesStart: "2026-10-05T00:00:00.000Z",
    SalesEnd: "2026-12-05T12:00:00.000Z",
    Status: "Active"
  });

  await tiersCol.create({
    EventId: e2Id,
    Name: "Eastern Gallery",
    Description: "Open tiered seating with energetic crowd support.",
    Price: 300,
    Currency: "BDT",
    TotalQuantity: 4000,
    AvailableQuantity: 3100,
    MaxPerBooking: 10,
    SalesStart: "2026-10-05T00:00:00.000Z",
    SalesEnd: "2026-12-05T15:00:00.000Z",
    Status: "Active"
  });

  // Event 3: Tech Bangladesh Summit
  const e3 = await eventsCol.create({
    Title: "Tech Bangladesh Summit 2026",
    Slug: "tech-bangladesh-summit-2026",
    Description: "The premier developer & startup convention exploring AI, Cloud Architecture, Fintech innovation, and venture capital opportunities in South Asia. 30+ international keynotes, workshops, and networking lounge.",
    Category: "Conference",
    Organizer: "Bangladesh Association of Software and Information Services (BASIS)",
    VenueName: "ICCB - Hall 4",
    VenueAddress: "Kuril Bishwa Road, Dhaka",
    City: "Dhaka",
    StartDateTime: "2026-10-25T09:00:00.000Z",
    EndDateTime: "2026-10-26T18:00:00.000Z",
    BannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    Status: "Published",
    IsFeatured: true
  });
  const e3Id = e3.data?.insertEvent?.itemId;
  console.log("Created Event 3:", e3Id);

  await tiersCol.create({
    EventId: e3Id,
    Name: "All-Access 2-Day Delegate Pass",
    Description: "Full access to keynotes, technical tracks, executive lunch & evening networking mixer.",
    Price: 3500,
    Currency: "BDT",
    TotalQuantity: 300,
    AvailableQuantity: 210,
    MaxPerBooking: 5,
    SalesStart: "2026-09-15T00:00:00.000Z",
    SalesEnd: "2026-10-24T23:59:00.000Z",
    Status: "Active"
  });

  await tiersCol.create({
    EventId: e3Id,
    Name: "Student Developer Pass",
    Description: "Discounted entry for verified university students with valid ID card.",
    Price: 500,
    Currency: "BDT",
    TotalQuantity: 500,
    AvailableQuantity: 420,
    MaxPerBooking: 2,
    SalesStart: "2026-09-15T00:00:00.000Z",
    SalesEnd: "2026-10-24T23:59:00.000Z",
    Status: "Active"
  });

  console.log("Seeding completed successfully!");
}

main().catch((err) => console.error("Error seeding:", err));