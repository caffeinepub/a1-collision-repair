import type {
  JobType,
  Part,
  PartStatus,
  Supplier,
  WorkOrderStatus,
} from "../backend";

export function getJobTypeLabel(jt: JobType): string {
  if ("Collision" in jt) return "Collision";
  if ("Paint" in jt) return "Paint";
  if ("Rust" in jt) return "Rust";
  if ("Glass" in jt) return "Glass";
  return "Mechanical";
}

export function getStatusLabel(s: WorkOrderStatus): string {
  if ("Estimate" in s) return "Estimate";
  if ("InProgress" in s) return "In Progress";
  if ("Ready" in s) return "Ready";
  if ("Delivered" in s) return "Delivered";
  return "On Hold";
}

export function getPartStatusLabel(s: PartStatus): string {
  if ("NeedToOrder" in s) return "Need to Order";
  if ("Ordered" in s) return "Ordered";
  return "Arrived";
}

export function getSupplierLabel(s: Supplier): string {
  if ("LKQ" in s) return "LKQ";
  if ("Keystone" in s) return "Keystone";
  if ("PartsGeek" in s) return "PartsGeek";
  if ("AutoZone" in s) return "AutoZone";
  if ("NAPA" in s) return "NAPA";
  if ("Dealer" in s) return "Dealer";
  return "Other";
}

export function calcPartsCost(parts: Part[]): number {
  return parts.reduce((sum, p) => sum + p.cost * Number(p.quantity), 0);
}

export function fmt(n: number): string {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function getStatusColor(s: WorkOrderStatus): string {
  if ("Estimate" in s) return "bg-slate-100 text-slate-700";
  if ("InProgress" in s) return "bg-blue-100 text-blue-700";
  if ("Ready" in s) return "bg-green-100 text-green-700";
  if ("Delivered" in s) return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

export function getPartStatusColor(s: PartStatus): string {
  if ("NeedToOrder" in s) return "bg-red-100 text-red-700";
  if ("Ordered" in s) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const TECHNICIANS = ["Jake Torres", "Carlos Ruiz", "Maria Vega"];

export const JOB_TYPES: { value: string; label: string }[] = [
  { value: "Collision", label: "Collision" },
  { value: "Paint", label: "Paint" },
  { value: "Rust", label: "Rust" },
  { value: "Glass", label: "Glass" },
  { value: "Mechanical", label: "Mechanical" },
];

export const STATUSES: { value: string; label: string }[] = [
  { value: "Estimate", label: "Estimate" },
  { value: "InProgress", label: "In Progress" },
  { value: "Ready", label: "Ready" },
  { value: "Delivered", label: "Delivered" },
  { value: "OnHold", label: "On Hold" },
];

export const SUPPLIERS: { value: string; label: string }[] = [
  { value: "LKQ", label: "LKQ" },
  { value: "Keystone", label: "Keystone" },
  { value: "PartsGeek", label: "PartsGeek" },
  { value: "AutoZone", label: "AutoZone" },
  { value: "NAPA", label: "NAPA" },
  { value: "Dealer", label: "Dealer" },
  { value: "Other", label: "Other" },
];

export const PART_STATUSES: { value: string; label: string }[] = [
  { value: "NeedToOrder", label: "Need to Order" },
  { value: "Ordered", label: "Ordered" },
  { value: "Arrived", label: "Arrived" },
];

export function jobTypeToVariant(label: string): JobType {
  const map: Record<string, JobType> = {
    Collision: { Collision: null },
    Paint: { Paint: null },
    Rust: { Rust: null },
    Glass: { Glass: null },
    Mechanical: { Mechanical: null },
  };
  return map[label] ?? { Collision: null };
}

export function statusToVariant(label: string): WorkOrderStatus {
  const map: Record<string, WorkOrderStatus> = {
    Estimate: { Estimate: null },
    InProgress: { InProgress: null },
    Ready: { Ready: null },
    Delivered: { Delivered: null },
    OnHold: { OnHold: null },
  };
  return map[label] ?? { Estimate: null };
}

export function supplierToVariant(label: string): Supplier {
  const map: Record<string, Supplier> = {
    LKQ: { LKQ: null },
    Keystone: { Keystone: null },
    PartsGeek: { PartsGeek: null },
    AutoZone: { AutoZone: null },
    NAPA: { NAPA: null },
    Dealer: { Dealer: null },
    Other: { Other: null },
  };
  return map[label] ?? { Other: null };
}

export function partStatusToVariant(label: string): PartStatus {
  const map: Record<string, PartStatus> = {
    NeedToOrder: { NeedToOrder: null },
    Ordered: { Ordered: null },
    Arrived: { Arrived: null },
  };
  return map[label] ?? { NeedToOrder: null };
}
