import { ReactNode } from "react";
import Link from "next/link";
import { Package, LayoutDashboard, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 sticky top-36">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider px-2">Painel Admin</h2>
          <nav className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-white bg-primary/10 text-primary rounded-md font-medium">
              <Package className="w-5 h-5" />
              Produtos
            </Link>
            {/* Future Links */}
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500 cursor-not-allowed font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Pedidos (Em Breve)
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-gray-500 cursor-not-allowed font-medium">
              <Settings className="w-5 h-5" />
              Configurações
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
