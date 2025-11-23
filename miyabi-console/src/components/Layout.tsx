import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Sidebar />

      <main className="pl-20 lg:pl-64 transition-all duration-300 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
