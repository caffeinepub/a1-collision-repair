import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Part, WorkOrderInput } from "../backend";
import WorkOrderForm from "../components/WorkOrderForm";
import WorkOrderModal from "../components/WorkOrderModal";
import { useActor } from "../hooks/useActor";
import {
  calcPartsCost,
  fmt,
  getJobTypeLabel,
  getPartStatusColor,
  getPartStatusLabel,
  getStatusColor,
  getStatusLabel,
} from "../lib/helpers";

type StatusFilter =
  | "All"
  | "Estimate"
  | "InProgress"
  | "Ready"
  | "Delivered"
  | "OnHold";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "All", label: "All" },
  { key: "Estimate", label: "Estimate" },
  { key: "InProgress", label: "In Progress" },
  { key: "Ready", label: "Ready" },
  { key: "Delivered", label: "Delivered" },
  { key: "OnHold", label: "On Hold" },
];

export default function WorkOrders() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: workOrders, isLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => actor!.getAllWorkOrders(),
    enabled: !!actor,
  });

  const { data: allParts } = useQuery({
    queryKey: ["allParts"],
    queryFn: () => actor!.getAllParts(),
    enabled: !!actor,
  });

  const createMutation = useMutation({
    mutationFn: (input: WorkOrderInput) => actor!.createWorkOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
      queryClient.invalidateQueries({ queryKey: ["recentWorkOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setShowCreate(false);
    },
  });

  const partsMap = useMemo(() => {
    const map: Record<string, Part[]> = {};
    for (const p of allParts ?? []) {
      if (!map[p.workOrderId]) map[p.workOrderId] = [];
      map[p.workOrderId].push(p);
    }
    return map;
  }, [allParts]);

  const filtered = useMemo(() => {
    let list = workOrders ?? [];
    if (filter !== "All") {
      list = list.filter((wo) => Object.keys(wo.status)[0] === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (wo) =>
          wo.customerName.toLowerCase().includes(q) ||
          wo.vehicle.toLowerCase().includes(q) ||
          wo.vin.toLowerCase().includes(q),
      );
    }
    return list;
  }, [workOrders, filter, search]);

  function getPartsPills(woId: string) {
    const parts = partsMap[woId] ?? [];
    const needToOrder = parts.filter((p) => "NeedToOrder" in p.status).length;
    const ordered = parts.filter((p) => "Ordered" in p.status).length;
    const arrived = parts.filter((p) => "Arrived" in p.status).length;
    return { needToOrder, ordered, arrived, total: parts.length };
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
          <p className="text-slate-500 text-sm">
            {workOrders?.length ?? 0} total orders
          </p>
        </div>
        <Button
          data-ocid="workorders.new.button"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Work Order
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-ocid="workorders.search.input"
          placeholder="Search by customer, vehicle, or VIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            data-ocid="workorders.filter.tab"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table data-ocid="workorders.table" className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "WO ID",
                  "Customer",
                  "Vehicle",
                  "Type",
                  "Tech",
                  "Parts",
                  "Approval",
                  "Status",
                  "Charge",
                  "Profit",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={11} className="px-4 py-8">
                    <Skeleton className="h-32" />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    No work orders found.
                  </td>
                </tr>
              )}
              {filtered.map((wo, idx) => {
                const pills = getPartsPills(wo.id);
                const woParts = partsMap[wo.id] ?? [];
                const pc = calcPartsCost(woParts);
                const profit = wo.chargeToCustomer - pc - wo.laborCost;
                const approved = !!wo.approvalPrintedName;
                return (
                  <tr
                    key={wo.id}
                    data-ocid={`workorders.row.item.${idx + 1}`}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedWoId(wo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedWoId(wo.id);
                    }}
                  >
                    <td className="px-3 py-2 font-mono font-medium text-blue-600">
                      {wo.id}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{wo.customerName}</div>
                      <div className="text-xs text-slate-400">{wo.phone}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{wo.vehicle}</div>
                      <div className="text-xs text-slate-400">{wo.color}</div>
                    </td>
                    <td className="px-3 py-2">{getJobTypeLabel(wo.jobType)}</td>
                    <td className="px-3 py-2 text-xs">
                      {wo.technicianName || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {pills.needToOrder > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            {pills.needToOrder} NTO
                          </span>
                        )}
                        {pills.ordered > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                            {pills.ordered} Ord
                          </span>
                        )}
                        {pills.arrived > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                            {pills.arrived} Arr
                          </span>
                        )}
                        {pills.total === 0 && (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          approved
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(wo.status)}`}
                      >
                        {getStatusLabel(wo.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {fmt(wo.chargeToCustomer)}
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${
                        profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {fmt(profit)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWoId(wo.id);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedWoId && (
        <WorkOrderModal
          workOrderId={selectedWoId}
          onClose={() => setSelectedWoId(null)}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <Dialog open onOpenChange={() => setShowCreate(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Work Order</DialogTitle>
            </DialogHeader>
            <WorkOrderForm
              onSave={(input) => createMutation.mutate(input)}
              onCancel={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
