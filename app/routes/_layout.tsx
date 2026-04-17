import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";
import TopNavBar from "~/components/TopNavBar";

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen transition-all duration-300 flex flex-col`}>
        <TopNavBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
