export interface PartnerParcel {
  id: string;
  trackingId: string;
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAltPhone?: string;
  receiverAddress: string;
  description: string;
  weight?: string;
  itemCount?: string;
  station: string;
  stationId: string;
  itemCost: number;
  deliveryFee: number;
  pod: boolean;
  status: "pending" | "received" | "delivered" | "collected" | "failed";
  submittedAt: string;
  collectedAt?: string;
  notes?: string;
}

export interface SendParcelForm {
  senderName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAltPhone: string;
  receiverAddress: string;
  description: string;
  weight: string;
  itemCount: string;
  stationId: string;
  itemCost: string;
  deliveryFee: string;
  pod: boolean;
}

export const EMPTY_FORM: SendParcelForm = {
  senderName: "",
  receiverName: "", receiverPhone: "", receiverAltPhone: "", receiverAddress: "",
  description: "", weight: "", itemCount: "",
  stationId: "", itemCost: "", deliveryFee: "", pod: false,
};

export const MOCK_STATIONS = [
  { id: "s1", name: "Accra Central",  location: "Accra" },
  { id: "s2", name: "Kumasi Main",    location: "Kumasi" },
  { id: "s3", name: "Takoradi Hub",   location: "Takoradi" },
  { id: "s4", name: "Tamale North",   location: "Tamale" },
  { id: "s5", name: "Cape Coast",     location: "Cape Coast" },
];

export const INITIAL_PARCELS: PartnerParcel[] = [
  { id: "1", trackingId: "MM240001", senderName: "Jumia Ghana", receiverName: "Kwame Mensah", receiverPhone: "+233541234567", receiverAddress: "Osu, Accra", description: "Electronics", station: "Accra Central", stationId: "s1", itemCost: 350, deliveryFee: 20, pod: true, status: "collected", submittedAt: "2024-12-01T10:00:00", collectedAt: "2024-12-03T14:30:00" },
  { id: "2", trackingId: "MM240002", senderName: "Jumia Ghana", receiverName: "Ama Asante", receiverPhone: "+233201234567", receiverAddress: "Adum, Kumasi", description: "Clothing", station: "Kumasi Main", stationId: "s2", itemCost: 180, deliveryFee: 15, pod: true, status: "delivered", submittedAt: "2024-12-02T09:00:00" },
  { id: "3", trackingId: "MM240003", senderName: "Jumia Ghana", receiverName: "Kofi Boateng", receiverPhone: "+233271234567", receiverAddress: "Takoradi Market", description: "Shoes", station: "Takoradi Hub", stationId: "s3", itemCost: 120, deliveryFee: 18, pod: true, status: "received", submittedAt: "2024-12-04T11:00:00" },
  { id: "4", trackingId: "MM240004", senderName: "Jumia Ghana", receiverName: "Abena Owusu", receiverPhone: "+233551234567", receiverAddress: "Tamale Central", description: "Books", station: "Tamale North", stationId: "s4", itemCost: 80, deliveryFee: 25, pod: false, status: "pending", submittedAt: "2024-12-05T08:00:00" },
  { id: "5", trackingId: "MM240005", senderName: "Jumia Ghana", receiverName: "Yaw Darko", receiverPhone: "+233241234567", receiverAddress: "Cape Coast Castle Rd", description: "Home appliance", station: "Cape Coast", stationId: "s5", itemCost: 500, deliveryFee: 30, pod: true, status: "failed", submittedAt: "2024-12-03T15:00:00", notes: "Recipient not available" },
  { id: "6", trackingId: "MM240006", senderName: "Jumia Ghana", receiverName: "Efua Mensah", receiverPhone: "+233261234567", receiverAddress: "East Legon, Accra", description: "Jewelry", station: "Accra Central", stationId: "s1", itemCost: 220, deliveryFee: 20, pod: true, status: "collected", submittedAt: "2024-12-06T07:00:00", collectedAt: "2024-12-07T10:00:00" },
];

export const formatCurrency = (v: number) => `GHC ${v.toFixed(2)}`;

export const generateTrackingId = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `MM${ts}${rand}`;
};

import { Clock, Package, Send, CheckCircle2, XCircle } from "lucide-react";

export const statusConfig: Record<PartnerParcel["status"], { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  received:  { label: "Received",  color: "bg-blue-100 text-blue-800",    icon: <Package className="w-3 h-3" /> },
  delivered: { label: "Delivered", color: "bg-purple-100 text-purple-800",icon: <Send className="w-3 h-3" /> },
  collected: { label: "Collected", color: "bg-green-100 text-green-800",  icon: <CheckCircle2 className="w-3 h-3" /> },
  failed:    { label: "Failed",    color: "bg-red-100 text-red-800",      icon: <XCircle className="w-3 h-3" /> },
};
