import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
