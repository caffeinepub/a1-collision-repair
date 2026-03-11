import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useActor } from "../hooks/useActor";
import { fmt, getPartStatusLabel, getSupplierLabel } from "../lib/helpers";

export default function PartsTracker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [woFilter, setWoFilter] = useState("all");

  const { data: allParts, isLoading: partsLoading } = useQuery({
    queryKey: ["allParts"],
    queryFn: () => actor!.getAllParts(),
    enabled: !!actor,
  });

  const { data: allWOs } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => actor!.getAllWorkOrders(),
    enabled: !!actor,
  });

  const advanceMutation = useMutation({
    mutationFn: (id: string) => actor!.advancePartStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allParts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["partsStatusCounts"] });
    },
  });

  const filteredParts = useMemo(() => {
    const parts = allParts ?? [];
    if (woFilter === "all") return parts;
    return parts.filter((p) => p.workOrderId === woFilter);
  }, [allParts, woFilter]);

  const kanbanCols = [
    {
      key: "NeedToOrder",
      label: "Need to Order",
      color: "bg-red-500",
      border: "border-red-200",
      bg: "bg-red-50",
    },
    {
      key: "Ordered",
      label: "Ordered",
      color: "bg-amber-500",
      border: "border-amber-200",
      bg: "bg-amber-50",
    },
    {
      key: "Arrived",
      label: "Arrived",
      color: "bg-green-500",
      border: "border-green-200",
      bg: "bg-green-50",
    },
  ];

  function getWoLabel(id: string) {
    const wo = allWOs?.find((w) => w.id === id);
    return wo ? `${wo.id} — ${wo.customerName}` : id;
  }

  function exportPDF() {
    const needParts = filteredParts.filter((p) => "NeedToOrder" in p.status);
    if (needParts.length === 0) {
      alert("No parts need to be ordered.");
      return;
    }
    const rows = needParts
      .map(
        (p) =>
          `<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:6px 8px">${p.workOrderId}</td><td style="padding:6px 8px">${p.partName}</td><td style="padding:6px 8px">${p.partNumber}</td><td style="padding:6px 8px">${getSupplierLabel(p.supplier)}</td><td style="padding:6px 8px">${fmt(p.cost)}</td><td style="padding:6px 8px">${Number(p.quantity)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><title>Parts to Order</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1e293b;color:white;padding:8px;text-align:left}h1{color:#1e293b}</style></head><body><h1>A1 Collision Repair — Parts to Order</h1><p>Generated: ${new Date().toLocaleDateString()}</p><table><thead><tr><th>Work Order</th><th>Part Name</th><th>Part #</th><th>Supplier</th><th>Cost</th><th>Qty</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }

  const uniqueWOs = [...new Set((allParts ?? []).map((p) => p.workOrderId))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parts Tracker</h1>
          <p className="text-slate-500 text-sm">
            {allParts?.length ?? 0} total parts
          </p>
        </div>
        <Button
          data-ocid="parts.export.button"
          className="bg-green-600 hover:bg-green-700"
          onClick={exportPDF}
        >
          <FileDown className="w-4 h-4 mr-2" /> Export Parts to Order
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">
          Filter by Work Order:
        </span>
        <Select value={woFilter} onValueChange={setWoFilter}>
          <SelectTrigger data-ocid="parts.filter.select" className="w-64">
            <SelectValue placeholder="All Active Jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Active Jobs</SelectItem>
            {uniqueWOs.map((id) => (
              <SelectItem key={id} value={id}>
                {getWoLabel(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {partsLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanCols.map((col) => {
            const colParts = filteredParts.filter(
              (p) => Object.keys(p.status)[0] === col.key,
            );
            return (
              <div
                key={col.key}
                className={`rounded-lg border ${col.border} overflow-hidden`}
              >
                <div
                  className={`${col.color} px-4 py-2 flex items-center justify-between`}
                >
                  <span className="text-white font-semibold text-sm">
                    {col.label}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {colParts.length}
                  </span>
                </div>
                <div className={`${col.bg} p-3 space-y-2 min-h-[120px]`}>
                  {colParts.length === 0 && (
                    <p className="text-xs text-slate-400 text-center pt-4">
                      No parts
                    </p>
                  )}
                  {colParts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded border border-slate-200 p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {p.partName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.workOrderId}
                          </p>
                          <p className="text-xs text-slate-400">
                            #{p.partNumber} • {getSupplierLabel(p.supplier)}
                          </p>
                          <p className="text-xs font-medium text-slate-700">
                            {fmt(p.cost)} × {Number(p.quantity)}
                          </p>
                        </div>
                        {col.key !== "Arrived" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs flex-shrink-0"
                            onClick={() => advanceMutation.mutate(p.id)}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-700">All Parts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[
                  "Part ID",
                  "Work Order",
                  "Part Name",
                  "Part #",
                  "Supplier",
                  "Cost",
                  "Qty",
                  "Status",
                  "Ordered",
                  "Arrived",
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
              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    No parts found.
                  </td>
                </tr>
              )}
              {filteredParts.map((p) => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-2 font-mono text-xs text-blue-600">
                    {p.workOrderId}
                  </td>
                  <td className="px-3 py-2 font-medium">{p.partName}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {p.partNumber}
                  </td>
                  <td className="px-3 py-2">{getSupplierLabel(p.supplier)}</td>
                  <td className="px-3 py-2">{fmt(p.cost)}</td>
                  <td className="px-3 py-2">{Number(p.quantity)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        "NeedToOrder" in p.status
                          ? "bg-red-100 text-red-700"
                          : "Ordered" in p.status
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {getPartStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{p.orderedDate || "—"}</td>
                  <td className="px-3 py-2 text-xs">{p.arrivedDate || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
