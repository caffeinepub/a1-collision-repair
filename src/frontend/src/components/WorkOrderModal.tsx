import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, PenLine, Plus } from "lucide-react";
import { useState } from "react";
import type { PartInput, WorkOrder, WorkOrderInput } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  calcPartsCost,
  fmt,
  getJobTypeLabel,
  getPartStatusColor,
  getPartStatusLabel,
  getStatusColor,
  getStatusLabel,
  getSupplierLabel,
  statusToVariant,
} from "../lib/helpers";
import PartForm from "./PartForm";
import SignatureCanvas from "./SignatureCanvas";
import WorkOrderForm from "./WorkOrderForm";

interface WorkOrderModalProps {
  workOrderId: string;
  onClose: () => void;
}

export default function WorkOrderModal({
  workOrderId,
  onClose,
}: WorkOrderModalProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [showSignature, setShowSignature] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCharge, setEditCharge] = useState<string | null>(null);
  const [editLabor, setEditLabor] = useState<string | null>(null);

  const { data: wof, isLoading } = useQuery({
    queryKey: ["wo-financials", workOrderId],
    queryFn: () => actor!.getWorkOrderWithFinancials(workOrderId),
    enabled: !!actor,
  });

  const wo = wof && wof.length > 0 ? wof[0]!.workOrder : null;
  const parts = wof && wof.length > 0 ? wof[0]!.parts : [];
  const partsCost = wof && wof.length > 0 ? wof[0]!.partsCost : 0;

  const updateMutation = useMutation({
    mutationFn: (input: WorkOrderInput) =>
      actor!.updateWorkOrder(workOrderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wo-financials", workOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
      queryClient.invalidateQueries({ queryKey: ["recentWorkOrders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const addPartMutation = useMutation({
    mutationFn: (input: PartInput) => actor!.createPart(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wo-financials", workOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["allParts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setShowAddPart(false);
    },
  });

  const advancePartMutation = useMutation({
    mutationFn: (id: string) => actor!.advancePartStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wo-financials", workOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ["allParts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  function handleStatusChange(newStatus: string) {
    if (!wo) return;
    const input: WorkOrderInput = {
      ...wo,
      status: statusToVariant(newStatus),
      chargeToCustomer:
        editCharge !== null
          ? Number.parseFloat(editCharge) || 0
          : wo.chargeToCustomer,
      laborCost:
        editLabor !== null ? Number.parseFloat(editLabor) || 0 : wo.laborCost,
    };
    updateMutation.mutate(input);
  }

  function handleSaveFinancials() {
    if (!wo) return;
    const input: WorkOrderInput = {
      ...wo,
      chargeToCustomer:
        editCharge !== null
          ? Number.parseFloat(editCharge) || 0
          : wo.chargeToCustomer,
      laborCost:
        editLabor !== null ? Number.parseFloat(editLabor) || 0 : wo.laborCost,
    };
    updateMutation.mutate(input);
    setEditCharge(null);
    setEditLabor(null);
  }

  function handleSignatureSave(name: string, sigData: string, date: string) {
    if (!wo) return;
    const input: WorkOrderInput = {
      ...wo,
      approvalPrintedName: name,
      approvalSignatureData: sigData,
      approvalDate: date,
    };
    updateMutation.mutate(input);
    setShowSignature(false);
  }

  function handleEditSave(input: WorkOrderInput) {
    updateMutation.mutate(input);
    setEditing(false);
  }

  const charge =
    editCharge !== null
      ? Number.parseFloat(editCharge) || 0
      : (wo?.chargeToCustomer ?? 0);
  const labor =
    editLabor !== null
      ? Number.parseFloat(editLabor) || 0
      : (wo?.laborCost ?? 0);
  const netProfit = charge - partsCost - labor;

  const statusButtons = [
    {
      key: "Estimate",
      label: "Estimate",
      ocid: "workorder_modal.status_estimate.button",
    },
    {
      key: "InProgress",
      label: "In Progress",
      ocid: "workorder_modal.status_inprogress.button",
    },
    {
      key: "Ready",
      label: "Ready",
      ocid: "workorder_modal.status_ready.button",
    },
    {
      key: "Delivered",
      label: "Delivered",
      ocid: "workorder_modal.status_delivered.button",
    },
    {
      key: "OnHold",
      label: "On Hold",
      ocid: "workorder_modal.status_onhold.button",
    },
  ];

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent
        data-ocid="workorder_modal.dialog"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading && (
          <div className="py-16 text-center text-slate-500">Loading...</div>
        )}
        {!isLoading && !wo && (
          <div className="py-16 text-center text-slate-500">
            Work order not found.
          </div>
        )}
        {!isLoading && wo && !editing && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">
                  {wo.id} — {wo.customerName}
                </DialogTitle>
                <Badge className={getStatusColor(wo.status)}>
                  {getStatusLabel(wo.status)}
                </Badge>
              </div>
            </DialogHeader>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Phone</span>
                <div className="font-medium">{wo.phone || "—"}</div>
              </div>
              <div>
                <span className="text-slate-500">Vehicle</span>
                <div className="font-medium">{wo.vehicle}</div>
              </div>
              <div>
                <span className="text-slate-500">Color</span>
                <div className="font-medium">{wo.color || "—"}</div>
              </div>
              <div>
                <span className="text-slate-500">VIN</span>
                <div className="font-medium font-mono text-xs">
                  {wo.vin || "—"}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Job Type</span>
                <div className="font-medium">{getJobTypeLabel(wo.jobType)}</div>
              </div>
              <div>
                <span className="text-slate-500">Technician</span>
                <div className="font-medium">{wo.technicianName || "—"}</div>
              </div>
              <div>
                <span className="text-slate-500">Date In</span>
                <div className="font-medium">{wo.dateIn}</div>
              </div>
              <div>
                <span className="text-slate-500">Date Delivered</span>
                <div className="font-medium">{wo.dateDelivered || "—"}</div>
              </div>
            </div>
            {wo.notes && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded p-2">
                {wo.notes}
              </p>
            )}

            {/* Status Buttons */}
            <Separator />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Change Status
              </p>
              <div className="flex flex-wrap gap-2">
                {statusButtons.map((s) => (
                  <Button
                    key={s.key}
                    data-ocid={s.ocid}
                    size="sm"
                    variant={
                      Object.keys(wo.status)[0] === s.key
                        ? "default"
                        : "outline"
                    }
                    className={
                      Object.keys(wo.status)[0] === s.key
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                    onClick={() => handleStatusChange(s.key)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Financials */}
            <Separator />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Financials
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Charge to Customer</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editCharge !== null ? editCharge : wo.chargeToCustomer
                      }
                      onChange={(e) => setEditCharge(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Labor / Tech Cost</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editLabor !== null ? editLabor : wo.laborCost}
                      onChange={(e) => setEditLabor(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 rounded p-2">
                  <div className="text-xs text-slate-500">
                    Parts Cost (auto)
                  </div>
                  <div className="font-semibold">{fmt(partsCost)}</div>
                </div>
                <div
                  className={`rounded p-2 ${netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}
                >
                  <div className="text-xs text-slate-500">Net Profit</div>
                  <div
                    className={`font-bold text-lg ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {fmt(netProfit)}
                  </div>
                </div>
              </div>
              {(editCharge !== null || editLabor !== null) && (
                <Button
                  size="sm"
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveFinancials}
                >
                  Save Financials
                </Button>
              )}
            </div>

            {/* Parts */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Parts ({parts.length})
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddPart(!showAddPart)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Part
                </Button>
              </div>
              {showAddPart && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <PartForm
                    workOrderId={workOrderId}
                    onSave={(input) => addPartMutation.mutate(input)}
                    onCancel={() => setShowAddPart(false)}
                  />
                </div>
              )}
              {parts.length === 0 && (
                <p className="text-sm text-slate-400">No parts added yet.</p>
              )}
              {parts.length > 0 && (
                <div className="space-y-2">
                  {parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-sm bg-slate-50 rounded p-2"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{p.partName}</span>
                        <span className="text-slate-400 ml-2">
                          #{p.partNumber}
                        </span>
                        <span className="text-slate-400 ml-2">
                          {getSupplierLabel(p.supplier)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {fmt(p.cost)} × {Number(p.quantity)}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getPartStatusColor(p.status)}`}
                      >
                        {getPartStatusLabel(p.status)}
                      </span>
                      {!("Arrived" in p.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => advancePartMutation.mutate(p.id)}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval */}
            <Separator />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Customer Approval
              </p>
              {wo.approvalPrintedName ? (
                <div className="space-y-2">
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>{" "}
                      <span className="font-medium">
                        {wo.approvalPrintedName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>{" "}
                      <span className="font-medium">{wo.approvalDate}</span>
                    </div>
                  </div>
                  {wo.approvalSignatureData && (
                    <img
                      src={wo.approvalSignatureData}
                      alt="Customer signature"
                      className="border rounded max-h-24"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSignature(true)}
                  >
                    <PenLine className="w-3 h-3 mr-1" /> Re-sign
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-2">
                    No customer signature yet.
                  </p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowSignature(true)}
                  >
                    <PenLine className="w-3 h-3 mr-1" /> Get Customer Signature
                  </Button>
                </div>
              )}
              {showSignature && (
                <div className="mt-3 bg-slate-50 rounded-lg p-3">
                  <SignatureCanvas
                    onSave={handleSignatureSave}
                    onCancel={() => setShowSignature(false)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit Work Order
              </Button>
              <div className="flex-1" />
              <Button
                data-ocid="workorder_modal.close_button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </>
        )}
        {!isLoading && wo && editing && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Work Order {wo.id}</DialogTitle>
            </DialogHeader>
            <WorkOrderForm
              initial={wo}
              onSave={(input) => {
                handleEditSave(input);
              }}
              onCancel={() => setEditing(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
