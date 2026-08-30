import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f6f0]">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-indigo-600" />
          <Link href={"/admin/dashboard" as any} className="text-xl font-bold text-navy hover:text-indigo-600 transition-colors">
            FXNOD Admin Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-500">
            admin@fxnod.com
          </div>
          <Link
            href={"/login" as any}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            Exit Admin
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
