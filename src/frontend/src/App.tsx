import { useEffect, useState } from "react";
import AppSidebar from "./components/AppSidebar";
import LoginPage from "./components/LoginPage";
import Dashboard from "./pages/Dashboard";
import MonthlyReports from "./pages/MonthlyReports";
import PartsTracker from "./pages/PartsTracker";
import WorkOrders from "./pages/WorkOrders";

type Page = "dashboard" | "workorders" | "parts" | "reports";

function isAuthenticated(): boolean {
  try {
    const val = localStorage.getItem("a1_session");
    if (!val) return false;
    const parsed = JSON.parse(val);
    return parsed?.authenticated === true;
  } catch {
    return false;
  }
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [page, setPage] = useState<Page>("dashboard");

  function handleLogin() {
    setAuthed(true);
  }

  function handleLogout() {
    localStorage.removeItem("a1_session");
    setAuthed(false);
  }

  if (!authed) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AppSidebar
        currentPage={page}
        onNavigate={setPage}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "workorders" && <WorkOrders />}
        {page === "parts" && <PartsTracker />}
        {page === "reports" && <MonthlyReports />}
      </main>
    </div>
  );
}
