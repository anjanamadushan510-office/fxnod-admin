"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Save, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/adminApi";

export default function CreateBlogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("status", "published");
    
    try {
      await adminApi.createBlog(formData);
      toast.success("Post created successfully!");
      router.push("/admin/blog");
    } catch (error) {
      console.error("Failed to create blog", error);
      toast.error("Failed to create the post. Check console.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 text-gray-400 hover:text-navy transition-colors rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Create New Post</h1>
          <p className="text-navy-3 mt-1">Publish a new guide or article to the public frontend.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-navy">Post Title</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required
              placeholder="e.g. How FXNOD Bot runs strategies..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-semibold text-navy">URL Slug</label>
            <input 
              type="text" 
              id="slug" 
              name="slug" 
              required
              placeholder="e.g. fxnod-bot-strategies"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tag" className="block text-sm font-semibold text-navy">Category Tag</label>
          <select 
            id="tags" 
            name="tags"
            className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
          >
            <option value="PRODUCT">PRODUCT</option>
            <option value="WALLET">WALLET</option>
            <option value="ACCESS">ACCESS</option>
            <option value="UPDATE">UPDATE</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="excerpt" className="block text-sm font-semibold text-navy">Short Excerpt</label>
          <textarea 
            id="excerpt" 
            name="excerpt" 
            required
            rows={2}
            placeholder="A brief summary that appears on the blog index card..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-navy">Cover Image</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden h-48 flex items-center justify-center">
            <input 
              type="file" 
              id="coverImage" 
              name="coverImage" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {previewUrl ? (
              <div className="absolute inset-0 w-full h-full">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Change Image
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-navy">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-semibold text-navy">Post Content (Markdown)</label>
          <textarea 
            id="content" 
            name="content" 
            required
            rows={15}
            placeholder="Write your article content here in Markdown format..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-y font-mono text-sm"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
          <Link href="/admin/blog" className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-2 transition-colors shadow-lg shadow-navy/20 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : (
              <>
                <Save className="w-5 h-5" />
                Publish Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
