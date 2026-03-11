import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import type { Identity } from "@icp-sdk/core/agent";

export type JobType = { Collision: null } | { Paint: null } | { Rust: null } | { Glass: null } | { Mechanical: null };
export type WorkOrderStatus = { Estimate: null } | { InProgress: null } | { Ready: null } | { Delivered: null } | { OnHold: null };
export type PartStatus = { NeedToOrder: null } | { Ordered: null } | { Arrived: null };
export type Supplier = { LKQ: null } | { Keystone: null } | { PartsGeek: null } | { AutoZone: null } | { NAPA: null } | { Dealer: null } | { Other: null };

export interface WorkOrder {
  id: string; customerName: string; phone: string; vehicle: string; vin: string; color: string;
  jobType: JobType; status: WorkOrderStatus; chargeToCustomer: number; laborCost: number;
  technicianName: string; dateIn: string; dateDelivered: string; notes: string;
  approvalPrintedName: string; approvalSignatureData: string; approvalDate: string;
}
export interface WorkOrderInput {
  customerName: string; phone: string; vehicle: string; vin: string; color: string;
  jobType: JobType; status: WorkOrderStatus; chargeToCustomer: number; laborCost: number;
  technicianName: string; dateIn: string; dateDelivered: string; notes: string;
  approvalPrintedName: string; approvalSignatureData: string; approvalDate: string;
}
export interface Part {
  id: string; workOrderId: string; partName: string; partNumber: string; supplier: Supplier;
  cost: number; quantity: bigint; status: PartStatus; orderedDate: string; arrivedDate: string; notes: string;
}
export interface PartInput {
  workOrderId: string; partName: string; partNumber: string; supplier: Supplier;
  cost: number; quantity: bigint; status: PartStatus; orderedDate: string; arrivedDate: string; notes: string;
}
export interface DashboardStats { activeJobs: bigint; inProgress: bigint; readyToDeliver: bigint; partsToOrder: bigint; }
export interface JobTypeCounts { collision: bigint; paint: bigint; rust: bigint; glass: bigint; mechanical: bigint; }
export interface PartsStatusCounts { needToOrder: bigint; ordered: bigint; arrived: bigint; }
export interface MonthlySummary { revenue: number; partsCost: number; laborCost: number; netProfit: number; }
export interface WorkOrderWithFinancials { workOrder: WorkOrder; partsCost: number; netProfit: number; parts: Part[]; }

export interface backendInterface {
  verifyPassword(password: string): Promise<boolean>;
  changePassword(oldPassword: string, newPassword: string): Promise<boolean>;
  createWorkOrder(input: WorkOrderInput): Promise<WorkOrder>;
  updateWorkOrder(id: string, input: WorkOrderInput): Promise<[] | [WorkOrder]>;
  deleteWorkOrder(id: string): Promise<boolean>;
  getWorkOrder(id: string): Promise<[] | [WorkOrder]>;
  getAllWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrdersByStatus(status: WorkOrderStatus): Promise<WorkOrder[]>;
  getRecentWorkOrders(limit: bigint): Promise<WorkOrder[]>;
  getWorkOrdersByMonth(month: bigint, year: bigint): Promise<WorkOrder[]>;
  createPart(input: PartInput): Promise<Part>;
  updatePart(id: string, input: PartInput): Promise<[] | [Part]>;
  deletePart(id: string): Promise<boolean>;
  getPart(id: string): Promise<[] | [Part]>;
  getPartsByWorkOrder(workOrderId: string): Promise<Part[]>;
  getAllParts(): Promise<Part[]>;
  advancePartStatus(id: string): Promise<[] | [Part]>;
  getDashboardStats(): Promise<DashboardStats>;
  getJobsByType(): Promise<JobTypeCounts>;
  getPartsStatusCounts(): Promise<PartsStatusCounts>;
  getMonthlyProfitSummary(month: bigint, year: bigint): Promise<MonthlySummary>;
  getWorkOrderWithFinancials(id: string): Promise<[] | [WorkOrderWithFinancials]>;
}

export interface CreateActorOptions {
  agentOptions?: { identity?: Identity | Promise<Identity> };
  agent?: HttpAgent;
  processError?: (e: unknown) => never;
}

export class ExternalBlob {
  private _url?: string;
  private _bytes?: Uint8Array;
  onProgress?: (progress: number) => void;

  static fromURL(url: string): ExternalBlob {
    const b = new ExternalBlob();
    b._url = url;
    return b;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const b = new ExternalBlob();
    b._bytes = bytes;
    return b;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const resp = await fetch(this._url);
      const buf = await resp.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Uint8Array();
  }
}

// Candid IDL factory
const idlFactory: IDL.InterfaceFactory = ({ IDL: I }) => {
  const JobType = I.Variant({
    Collision: I.Null, Paint: I.Null, Rust: I.Null, Glass: I.Null, Mechanical: I.Null,
  });
  const WorkOrderStatus = I.Variant({
    Estimate: I.Null, InProgress: I.Null, Ready: I.Null, Delivered: I.Null, OnHold: I.Null,
  });
  const PartStatus = I.Variant({
    NeedToOrder: I.Null, Ordered: I.Null, Arrived: I.Null,
  });
  const Supplier = I.Variant({
    LKQ: I.Null, Keystone: I.Null, PartsGeek: I.Null, AutoZone: I.Null, NAPA: I.Null, Dealer: I.Null, Other: I.Null,
  });
  const WorkOrder = I.Record({
    id: I.Text, customerName: I.Text, phone: I.Text, vehicle: I.Text, vin: I.Text, color: I.Text,
    jobType: JobType, status: WorkOrderStatus, chargeToCustomer: I.Float64, laborCost: I.Float64,
    technicianName: I.Text, dateIn: I.Text, dateDelivered: I.Text, notes: I.Text,
    approvalPrintedName: I.Text, approvalSignatureData: I.Text, approvalDate: I.Text,
  });
  const WorkOrderInput = I.Record({
    customerName: I.Text, phone: I.Text, vehicle: I.Text, vin: I.Text, color: I.Text,
    jobType: JobType, status: WorkOrderStatus, chargeToCustomer: I.Float64, laborCost: I.Float64,
    technicianName: I.Text, dateIn: I.Text, dateDelivered: I.Text, notes: I.Text,
    approvalPrintedName: I.Text, approvalSignatureData: I.Text, approvalDate: I.Text,
  });
  const Part = I.Record({
    id: I.Text, workOrderId: I.Text, partName: I.Text, partNumber: I.Text, supplier: Supplier,
    cost: I.Float64, quantity: I.Nat, status: PartStatus, orderedDate: I.Text, arrivedDate: I.Text, notes: I.Text,
  });
  const PartInput = I.Record({
    workOrderId: I.Text, partName: I.Text, partNumber: I.Text, supplier: Supplier,
    cost: I.Float64, quantity: I.Nat, status: PartStatus, orderedDate: I.Text, arrivedDate: I.Text, notes: I.Text,
  });
  const DashboardStats = I.Record({
    activeJobs: I.Nat, inProgress: I.Nat, readyToDeliver: I.Nat, partsToOrder: I.Nat,
  });
  const JobTypeCounts = I.Record({
    collision: I.Nat, paint: I.Nat, rust: I.Nat, glass: I.Nat, mechanical: I.Nat,
  });
  const PartsStatusCounts = I.Record({
    needToOrder: I.Nat, ordered: I.Nat, arrived: I.Nat,
  });
  const MonthlySummary = I.Record({
    revenue: I.Float64, partsCost: I.Float64, laborCost: I.Float64, netProfit: I.Float64,
  });
  const WorkOrderWithFinancials = I.Record({
    workOrder: WorkOrder, partsCost: I.Float64, netProfit: I.Float64, parts: I.Vec(Part),
  });

  return I.Service({
    verifyPassword: I.Func([I.Text], [I.Bool], []),
    changePassword: I.Func([I.Text, I.Text], [I.Bool], []),
    createWorkOrder: I.Func([WorkOrderInput], [WorkOrder], []),
    updateWorkOrder: I.Func([I.Text, WorkOrderInput], [I.Opt(WorkOrder)], []),
    deleteWorkOrder: I.Func([I.Text], [I.Bool], []),
    getWorkOrder: I.Func([I.Text], [I.Opt(WorkOrder)], ['query']),
    getAllWorkOrders: I.Func([], [I.Vec(WorkOrder)], ['query']),
    getWorkOrdersByStatus: I.Func([WorkOrderStatus], [I.Vec(WorkOrder)], ['query']),
    getRecentWorkOrders: I.Func([I.Nat], [I.Vec(WorkOrder)], ['query']),
    getWorkOrdersByMonth: I.Func([I.Nat, I.Nat], [I.Vec(WorkOrder)], ['query']),
    createPart: I.Func([PartInput], [Part], []),
    updatePart: I.Func([I.Text, PartInput], [I.Opt(Part)], []),
    deletePart: I.Func([I.Text], [I.Bool], []),
    getPart: I.Func([I.Text], [I.Opt(Part)], ['query']),
    getPartsByWorkOrder: I.Func([I.Text], [I.Vec(Part)], ['query']),
    getAllParts: I.Func([], [I.Vec(Part)], ['query']),
    advancePartStatus: I.Func([I.Text], [I.Opt(Part)], []),
    getDashboardStats: I.Func([], [DashboardStats], ['query']),
    getJobsByType: I.Func([], [JobTypeCounts], ['query']),
    getPartsStatusCounts: I.Func([], [PartsStatusCounts], ['query']),
    getMonthlyProfitSummary: I.Func([I.Nat, I.Nat], [MonthlySummary], ['query']),
    getWorkOrderWithFinancials: I.Func([I.Text], [I.Opt(WorkOrderWithFinancials)], ['query']),
  });
};

export async function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): Promise<backendInterface> {
  const agent = options?.agent ?? new HttpAgent({ ...options?.agentOptions });
  const actor = Actor.createActor<backendInterface>(idlFactory, {
    agent,
    canisterId,
  });
  return actor;
}
