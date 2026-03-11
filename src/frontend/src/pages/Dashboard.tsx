import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Briefcase, CheckCircle, Hammer } from "lucide-react";
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
import { useActor } from "../hooks/useActor";
import {
  MONTH_NAMES,
  fmt,
  getStatusColor,
  getStatusLabel,
} from "../lib/helpers";

export default function Dashboard() {
  const { actor } = useActor();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: stats, isLoading: l1 } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => actor!.getDashboardStats(),
    enabled: !!actor,
  });
  const { data: jobTypes, isLoading: l2 } = useQuery({
    queryKey: ["jobsByType"],
    queryFn: () => actor!.getJobsByType(),
    enabled: !!actor,
  });
  const { data: partsCounts, isLoading: l3 } = useQuery({
    queryKey: ["partsStatusCounts"],
    queryFn: () => actor!.getPartsStatusCounts(),
    enabled: !!actor,
  });
  const { data: profitSummary, isLoading: l4 } = useQuery({
    queryKey: ["monthlyProfit", month, year],
    queryFn: () => actor!.getMonthlyProfitSummary(BigInt(month), BigInt(year)),
    enabled: !!actor,
  });
  const { data: recentWOs, isLoading: l5 } = useQuery({
    queryKey: ["recentWorkOrders"],
    queryFn: () => actor!.getRecentWorkOrders(5n),
    enabled: !!actor,
  });

  const jobTypeData = jobTypes
    ? [
        { name: "Collision", count: Number(jobTypes.collision) },
        { name: "Paint", count: Number(jobTypes.paint) },
        { name: "Rust", count: Number(jobTypes.rust) },
        { name: "Glass", count: Number(jobTypes.glass) },
        { name: "Mechanical", count: Number(jobTypes.mechanical) },
      ]
    : [];

  const partsData = partsCounts
    ? [
        {
          name: "Need to Order",
          count: Number(partsCounts.needToOrder),
          color: "#ef4444",
        },
        {
          name: "Ordered",
          count: Number(partsCounts.ordered),
          color: "#f59e0b",
        },
        {
          name: "Arrived",
          count: Number(partsCounts.arrived),
          color: "#22c55e",
        },
      ]
    : [];

  const statCards = [
    {
      label: "Active Jobs",
      value: stats ? Number(stats.activeJobs) : 0,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ocid: "dashboard.active_jobs.card",
    },
    {
      label: "In Progress",
      value: stats ? Number(stats.inProgress) : 0,
      icon: Hammer,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ocid: "dashboard.in_progress.card",
    },
    {
      label: "Ready to Deliver",
      value: stats ? Number(stats.readyToDeliver) : 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      ocid: "dashboard.ready.card",
    },
    {
      label: "Parts to Order",
      value: stats ? Number(stats.partsToOrder) : 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      ocid: "dashboard.parts_to_order.card",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">
          A1 Collision Repair — Shop Overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              data-ocid={card.ocid}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.label}</p>
                    {l1 ? (
                      <Skeleton className="h-8 w-12 mt-1" />
                    ) : (
                      <p className={`text-3xl font-bold ${card.color}`}>
                        {card.value}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {l2 ? (
              <Skeleton className="h-40" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={jobTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parts Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {l3 ? (
              <Skeleton className="h-40" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={partsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {partsData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {MONTH_NAMES[month - 1]} {year} — Profit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {l4 ? (
            <Skeleton className="h-16" />
          ) : profitSummary ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Revenue</p>
                <p className="text-xl font-bold text-blue-700">
                  {fmt(profitSummary.revenue)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Parts Cost</p>
                <p className="text-xl font-bold text-red-700">
                  {fmt(profitSummary.partsCost)}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Labor Cost</p>
                <p className="text-xl font-bold text-amber-700">
                  {fmt(profitSummary.laborCost)}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 ${profitSummary.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}
              >
                <p className="text-xs text-slate-500">Net Profit</p>
                <p
                  className={`text-xl font-bold ${profitSummary.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                >
                  {fmt(profitSummary.netProfit)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No deliveries this month.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Work Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {l5 ? (
            <div className="p-4">
              <Skeleton className="h-32" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {[
                      "WO ID",
                      "Customer",
                      "Vehicle",
                      "Status",
                      "Approval",
                      "Estimate",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentWOs ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-slate-400"
                      >
                        No work orders yet.
                      </td>
                    </tr>
                  )}
                  {(recentWOs ?? []).map((wo) => {
                    const approved = !!wo.approvalPrintedName;
                    return (
                      <tr key={wo.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono font-medium">
                          {wo.id}
                        </td>
                        <td className="px-4 py-2">{wo.customerName}</td>
                        <td className="px-4 py-2">{wo.vehicle}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(wo.status)}`}
                          >
                            {getStatusLabel(wo.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {approved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {fmt(wo.chargeToCustomer)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
