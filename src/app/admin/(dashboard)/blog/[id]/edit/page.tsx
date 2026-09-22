"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Save, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/adminApi";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    adminApi.getBlog(params.id)
      .then((data) => {
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt);
        setContent(data.content);
        setTags(data.tags && data.tags.length > 0 ? data.tags[0] : "PRODUCT");
        
        if (data.cover_image) {
          const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
          setPreviewUrl(
            data.cover_image.startsWith('http') 
              ? data.cover_image 
              : `${apiUrl}${data.cover_image.startsWith('/') ? '' : '/'}${data.cover_image}`
          );
        }
      })
      .catch((err) => {
        console.error("Failed to fetch blog", err);
        toast.error("Failed to load blog post.");
        router.push("/admin/blog");
      })
      .finally(() => setIsLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    // Only cleanup blob URLs (uploaded files), not http/https URLs from server
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    // Keep existing status
    
    try {
      await adminApi.updateBlog(params.id, formData);
      toast.success("Post updated successfully!");
      router.push("/admin/blog");
    } catch (error) {
      console.error("Failed to update blog", error);
      toast.error("Failed to update the post. Check console.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-gray-500 animate-pulse">Loading post data...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog" className="p-2 text-gray-400 hover:text-navy transition-colors rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-navy tracking-tight">Edit Post</h1>
          <p className="text-navy-3 mt-1">Update your existing guide or article.</p>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. fxnod-bot-strategies"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-semibold text-navy">Category Tag</label>
          <select 
            id="tags" 
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
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
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
                Update Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
