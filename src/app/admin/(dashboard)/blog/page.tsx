"use client";

import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";

interface Blog {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
}

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getBlogs()
      .then((data) => setBlogs(data))
      .catch((err) => console.error("Failed to fetch blogs", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => {
    toast('Are you sure you want to delete this blog post?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await adminApi.deleteBlog(id);
            setBlogs((prev) => prev.filter(b => b.id !== id));
            toast.success("Blog post deleted successfully.");
          } catch (err) {
            console.error(err);
            toast.error("Failed to delete blog post.");
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      const updatedBlog = await adminApi.toggleBlogVisibility(id);
      setBlogs((prev) => prev.map(b => b.id === id ? { ...b, status: updatedBlog.status } : b));
      toast.success(`Post ${updatedBlog.status === 'published' ? 'published' : 'hidden'}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle visibility.");
    }
  };

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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Loading blogs...
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No blogs found. Create one!
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-navy">{blog.title}</div>
                      <div className="text-sm text-gray-500 mt-1">/{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleToggleVisibility(blog.id)}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
                        title={blog.status === 'published' ? 'Hide Post' : 'Publish Post'}
                      >
                        {blog.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <Link 
                        href={`/admin/blog/${blog.id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
