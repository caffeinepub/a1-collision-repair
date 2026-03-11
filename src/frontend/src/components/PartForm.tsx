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
import type { PartInput } from "../backend";
import {
  PART_STATUSES,
  SUPPLIERS,
  partStatusToVariant,
  supplierToVariant,
} from "../lib/helpers";

interface PartFormProps {
  workOrderId: string;
  onSave: (input: PartInput) => void;
  onCancel: () => void;
}

export default function PartForm({
  workOrderId,
  onSave,
  onCancel,
}: PartFormProps) {
  const [form, setForm] = useState({
    partName: "",
    partNumber: "",
    supplier: "LKQ",
    cost: "",
    quantity: "1",
    status: "NeedToOrder",
    orderedDate: "",
    arrivedDate: "",
    notes: "",
  });

  function handleSave() {
    if (!form.partName.trim()) {
      alert("Part name is required");
      return;
    }
    const input: PartInput = {
      workOrderId,
      partName: form.partName,
      partNumber: form.partNumber,
      supplier: supplierToVariant(form.supplier),
      cost: Number.parseFloat(form.cost) || 0,
      quantity: BigInt(Number.parseInt(form.quantity) || 1),
      status: partStatusToVariant(form.status),
      orderedDate: form.orderedDate,
      arrivedDate: form.arrivedDate,
      notes: form.notes,
    };
    onSave(input);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Part Name *</Label>
          <Input
            value={form.partName}
            onChange={(e) => setForm({ ...form, partName: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Part Number</Label>
          <Input
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Supplier</Label>
          <Select
            value={form.supplier}
            onValueChange={(v) => setForm({ ...form, supplier: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPLIERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PART_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cost ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Ordered Date</Label>
          <Input
            type="date"
            value={form.orderedDate}
            onChange={(e) => setForm({ ...form, orderedDate: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Arrived Date</Label>
          <Input
            type="date"
            value={form.arrivedDate}
            onChange={(e) => setForm({ ...form, arrivedDate: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="mt-1"
          rows={2}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
        >
          Add Part
        </Button>
      </div>
    </div>
  );
}
