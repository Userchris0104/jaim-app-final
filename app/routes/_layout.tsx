import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen transition-all duration-300`}>
        <Outlet />
      </main>
    </div>
  );
}
