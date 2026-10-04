import { Calendar, Ticket, ShieldCheck, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.events", icon: Calendar },
  { href: "/my-tickets", labelKey: "nav.myTickets", icon: Ticket },
  { href: "/organizer", labelKey: "nav.organizer", icon: ShieldCheck },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound }
] as const;
