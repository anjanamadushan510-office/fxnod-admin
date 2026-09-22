"use client";

import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

const mockBlogs = [
  { id: "1", title: "How FXNOD Bot runs strategies on Deriv", slug: "fxnod-bot-strategies", status: "Published", date: "11 SEP 2026" },
  { id: "2", title: "Send FXNOD Wallet funds onto Deriv", slug: "send-wallet-funds", status: "Draft", date: "11 SEP 2026" },
  { id: "3", title: "Free API markup vs monthly wallet plans", slug: "free-vs-monthly", status: "Published", date: "10 SEP 2026" },
];

export default function BlogManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Blog Management</h1>
          <p className="text-navy-3 mt-1">Manage public guides and articles.</p>
        </div>
        <Link href="/admin/blog/create" className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-medium hover:bg-navy-2 transition-colors shadow-lg shadow-navy/20">
          <Plus className="w-5 h-5" />
          Create New Post
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-navy">{blog.title}</div>
                    <div className="text-sm text-gray-500 mt-1">/{blog.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      blog.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {blog.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
