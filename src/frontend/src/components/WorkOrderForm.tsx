import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { WorkOrder, WorkOrderInput } from "../backend";
import {
  JOB_TYPES,
  STATUSES,
  TECHNICIANS,
  jobTypeToVariant,
  statusToVariant,
} from "../lib/helpers";

interface WorkOrderFormProps {
  initial?: WorkOrder;
  onSave: (input: WorkOrderInput) => void;
  onCancel: () => void;
}

export default function WorkOrderForm({
  initial,
  onSave,
  onCancel,
}: WorkOrderFormProps) {
  const [form, setForm] = useState({
    customerName: initial?.customerName ?? "",
    phone: initial?.phone ?? "",
    vehicle: initial?.vehicle ?? "",
    vin: initial?.vin ?? "",
    color: initial?.color ?? "",
    jobType: initial ? Object.keys(initial.jobType)[0] : "Collision",
    status: initial ? Object.keys(initial.status)[0] : "Estimate",
    chargeToCustomer: initial ? String(initial.chargeToCustomer) : "",
    laborCost: initial ? String(initial.laborCost) : "",
    technicianName: initial?.technicianName ?? "",
    dateIn: initial?.dateIn ?? new Date().toISOString().split("T")[0],
    dateDelivered: initial?.dateDelivered ?? "",
    notes: initial?.notes ?? "",
  });

  function handleSave() {
    if (!form.customerName.trim()) {
      alert("Customer name required");
      return;
    }
    const input: WorkOrderInput = {
      customerName: form.customerName,
      phone: form.phone,
      vehicle: form.vehicle,
      vin: form.vin,
      color: form.color,
      jobType: jobTypeToVariant(form.jobType),
      status: statusToVariant(form.status),
      chargeToCustomer: Number.parseFloat(form.chargeToCustomer) || 0,
      laborCost: Number.parseFloat(form.laborCost) || 0,
      technicianName: form.technicianName,
      dateIn: form.dateIn,
      dateDelivered: form.dateDelivered,
      notes: form.notes,
      approvalPrintedName: initial?.approvalPrintedName ?? "",
      approvalSignatureData: initial?.approvalSignatureData ?? "",
      approvalDate: initial?.approvalDate ?? "",
    };
    onSave(input);
  }

  const f = form;
  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Customer Name *</Label>
          <Input
            value={f.customerName}
            onChange={set("customerName")}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={f.phone} onChange={set("phone")} className="mt-1" />
        </div>
        <div>
          <Label>Vehicle (Year Make Model)</Label>
          <Input
            value={f.vehicle}
            onChange={set("vehicle")}
            className="mt-1"
            placeholder="2020 Toyota Camry"
          />
        </div>
        <div>
          <Label>VIN</Label>
          <Input value={f.vin} onChange={set("vin")} className="mt-1" />
        </div>
        <div>
          <Label>Color</Label>
          <Input value={f.color} onChange={set("color")} className="mt-1" />
        </div>
        <div>
          <Label>Job Type</Label>
          <Select
            value={f.jobType}
            onValueChange={(v) => setForm((p) => ({ ...p, jobType: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={f.status}
            onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Technician</Label>
          <Select
            value={f.technicianName}
            onValueChange={(v) => setForm((p) => ({ ...p, technicianName: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select tech" />
            </SelectTrigger>
            <SelectContent>
              {TECHNICIANS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Charge to Customer ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.chargeToCustomer}
            onChange={set("chargeToCustomer")}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Labor Cost ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={f.laborCost}
            onChange={set("laborCost")}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Date In</Label>
          <Input
            type="date"
            value={f.dateIn}
            onChange={set("dateIn")}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Date Delivered</Label>
          <Input
            type="date"
            value={f.dateDelivered}
            onChange={set("dateDelivered")}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={f.notes}
          onChange={set("notes")}
          className="mt-1"
          rows={3}
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
        >
          {initial ? "Update Work Order" : "Create Work Order"}
        </Button>
      </div>
    </div>
  );
}
