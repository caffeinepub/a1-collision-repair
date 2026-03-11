import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Part } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  MONTH_NAMES,
  calcPartsCost,
  fmt,
  getJobTypeLabel,
} from "../lib/helpers";

function getPartsCostForWO(woId: string, parts: Part[]): number {
  return calcPartsCost(parts.filter((p) => p.workOrderId === woId));
}

function parseDate(d: string): { month: number; year: number } {
  if (!d || d.length < 7) return { month: 0, year: 0 };
  return {
    year: Number.parseInt(d.substring(0, 4)),
    month: Number.parseInt(d.substring(5, 7)),
  };
}

export default function MonthlyReports() {
  const { actor } = useActor();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selMonth, setSelMonth] = useState(currentMonth);
  const [selYear, setSelYear] = useState(currentYear);

  const { data: allWOs, isLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => actor!.getAllWorkOrders(),
    enabled: !!actor,
  });
  const { data: allParts } = useQuery({
    queryKey: ["allParts"],
    queryFn: () => actor!.getAllParts(),
    enabled: !!actor,
  });

  const years = useMemo(() => {
    const ys = new Set<number>();
    for (const wo of allWOs ?? []) {
      if (wo.dateDelivered)
        ys.add(Number.parseInt(wo.dateDelivered.substring(0, 4)));
    }
    ys.add(currentYear);
    return Array.from(ys).sort((a, b) => b - a);
  }, [allWOs, currentYear]);

  const deliveredWOs = useMemo(
    () =>
      (allWOs ?? []).filter(
        (wo) => "Delivered" in wo.status && !!wo.dateDelivered,
      ),
    [allWOs],
  );

  const monthWOs = useMemo(
    () =>
      deliveredWOs.filter((wo) => {
        const { month, year } = parseDate(wo.dateDelivered);
        return month === selMonth && year === selYear;
      }),
    [deliveredWOs, selMonth, selYear],
  );

  const monthSummary = useMemo(() => {
    const parts = allParts ?? [];
    let revenue = 0;
    let pCost = 0;
    let lCost = 0;
    for (const wo of monthWOs) {
      revenue += wo.chargeToCustomer;
      pCost += getPartsCostForWO(wo.id, parts);
      lCost += wo.laborCost;
    }
    return {
      revenue,
      partsCost: pCost,
      laborCost: lCost,
      netProfit: revenue - pCost - lCost,
    };
  }, [monthWOs, allParts]);

  const yearSummary = useMemo(() => {
    const parts = allParts ?? [];
    return MONTH_NAMES.map((name, idx) => {
      const m = idx + 1;
      const wos = deliveredWOs.filter((wo) => {
        const { month, year } = parseDate(wo.dateDelivered);
        return month === m && year === selYear;
      });
      let revenue = 0;
      let pCost = 0;
      let lCost = 0;
      for (const wo of wos) {
        revenue += wo.chargeToCustomer;
        pCost += getPartsCostForWO(wo.id, parts);
        lCost += wo.laborCost;
      }
      const netProfit = revenue - pCost - lCost;
      return {
        name: name.substring(0, 3),
        month: m,
        revenue,
        partsCost: pCost,
        laborCost: lCost,
        netProfit,
        jobs: wos.length,
      };
    });
  }, [deliveredWOs, allParts, selYear]);

  const bestMonth = useMemo(() => {
    return yearSummary.reduce(
      (best, m) => (m.netProfit > best.netProfit ? m : best),
      yearSummary[0],
    );
  }, [yearSummary]);

  const jobTypeBreakdown = useMemo(() => {
    const parts = allParts ?? [];
    const map: Record<
      string,
      {
        revenue: number;
        partsCost: number;
        laborCost: number;
        netProfit: number;
        count: number;
      }
    > = {};
    const wos = deliveredWOs.filter(
      (wo) => parseDate(wo.dateDelivered).year === selYear,
    );
    for (const wo of wos) {
      const type = getJobTypeLabel(wo.jobType);
      if (!map[type])
        map[type] = {
          revenue: 0,
          partsCost: 0,
          laborCost: 0,
          netProfit: 0,
          count: 0,
        };
      const pc = getPartsCostForWO(wo.id, parts);
      map[type].revenue += wo.chargeToCustomer;
      map[type].partsCost += pc;
      map[type].laborCost += wo.laborCost;
      map[type].netProfit += wo.chargeToCustomer - pc - wo.laborCost;
      map[type].count += 1;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [deliveredWOs, allParts, selYear]);

  const techBreakdown = useMemo(() => {
    const parts = allParts ?? [];
    const map: Record<
      string,
      {
        revenue: number;
        partsCost: number;
        laborCost: number;
        netProfit: number;
        jobs: number;
      }
    > = {};
    const wos = deliveredWOs.filter(
      (wo) => parseDate(wo.dateDelivered).year === selYear,
    );
    for (const wo of wos) {
      const tech = wo.technicianName || "Unknown";
      if (!map[tech])
        map[tech] = {
          revenue: 0,
          partsCost: 0,
          laborCost: 0,
          netProfit: 0,
          jobs: 0,
        };
      const pc = getPartsCostForWO(wo.id, parts);
      map[tech].revenue += wo.chargeToCustomer;
      map[tech].partsCost += pc;
      map[tech].laborCost += wo.laborCost;
      map[tech].netProfit += wo.chargeToCustomer - pc - wo.laborCost;
      map[tech].jobs += 1;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [deliveredWOs, allParts, selYear]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Reports</h1>
          <p className="text-slate-500 text-sm">
            Financial performance by period
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={String(selMonth)}
            onValueChange={(v) => setSelMonth(Number.parseInt(v))}
          >
            <SelectTrigger data-ocid="reports.month.select" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selYear)}
            onValueChange={(v) => setSelYear(Number.parseInt(v))}
          >
            <SelectTrigger data-ocid="reports.year.select" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Revenue",
                value: monthSummary.revenue,
                color: "text-blue-700",
                bg: "bg-blue-50",
              },
              {
                label: "Parts Cost",
                value: monthSummary.partsCost,
                color: "text-red-700",
                bg: "bg-red-50",
              },
              {
                label: "Labor Cost",
                value: monthSummary.laborCost,
                color: "text-amber-700",
                bg: "bg-amber-50",
              },
              {
                label: "Net Profit",
                value: monthSummary.netProfit,
                color:
                  monthSummary.netProfit >= 0
                    ? "text-green-700"
                    : "text-red-700",
                bg: monthSummary.netProfit >= 0 ? "bg-green-50" : "bg-red-50",
              },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>
                    {fmt(item.value)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {monthWOs.length} job{monthWOs.length !== 1 ? "s" : ""}{" "}
                    delivered
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {monthWOs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Jobs Delivered in {MONTH_NAMES[selMonth - 1]} {selYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        {[
                          "WO ID",
                          "Customer",
                          "Vehicle",
                          "Charge",
                          "Parts Cost",
                          "Labor",
                          "Profit",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthWOs.map((wo) => {
                        const pc = getPartsCostForWO(wo.id, allParts ?? []);
                        const profit = wo.chargeToCustomer - pc - wo.laborCost;
                        return (
                          <tr
                            key={wo.id}
                            className="border-b hover:bg-slate-50"
                          >
                            <td className="px-3 py-2 font-mono text-blue-600">
                              {wo.id}
                            </td>
                            <td className="px-3 py-2">{wo.customerName}</td>
                            <td className="px-3 py-2">{wo.vehicle}</td>
                            <td className="px-3 py-2">
                              {fmt(wo.chargeToCustomer)}
                            </td>
                            <td className="px-3 py-2">{fmt(pc)}</td>
                            <td className="px-3 py-2">{fmt(wo.laborCost)}</td>
                            <td
                              className={`px-3 py-2 font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {fmt(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {selYear} — Year Overview
                </CardTitle>
                {bestMonth && bestMonth.jobs > 0 && (
                  <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-700 font-medium">
                      Best Month: {bestMonth.name} ({fmt(bestMonth.netProfit)})
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar
                    dataKey="netProfit"
                    name="Net Profit"
                    radius={[4, 4, 0, 0]}
                  >
                    {yearSummary.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.month === selMonth
                            ? "#3b82f6"
                            : entry.netProfit >= 0
                              ? "#22c55e"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  By Job Type — {selYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {["Type", "Jobs", "Revenue", "Net Profit"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobTypeBreakdown.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-6 text-slate-400"
                        >
                          No data.
                        </td>
                      </tr>
                    )}
                    {[...jobTypeBreakdown]
                      .sort((a, b) => b.netProfit - a.netProfit)
                      .map((row) => (
                        <tr key={row.name} className="border-b">
                          <td className="px-3 py-2 font-medium">{row.name}</td>
                          <td className="px-3 py-2">{row.count}</td>
                          <td className="px-3 py-2">{fmt(row.revenue)}</td>
                          <td
                            className={`px-3 py-2 font-medium ${row.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {fmt(row.netProfit)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  By Technician — {selYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      {["Technician", "Jobs", "Revenue", "Net Profit"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {techBreakdown.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-6 text-slate-400"
                        >
                          No data.
                        </td>
                      </tr>
                    )}
                    {[...techBreakdown]
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((row) => (
                        <tr key={row.name} className="border-b">
                          <td className="px-3 py-2 font-medium">{row.name}</td>
                          <td className="px-3 py-2">{row.jobs}</td>
                          <td className="px-3 py-2">{fmt(row.revenue)}</td>
                          <td
                            className={`px-3 py-2 font-medium ${row.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {fmt(row.netProfit)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
