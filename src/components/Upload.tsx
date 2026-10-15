"use client";

import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload file");
      }

      await res.json();
      setResult("Data extracted and saved successfully!");
      setFile(null);
      setTitle("");
    } catch (error) {
      console.error(error);
      setResult("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-black">
      <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Document title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">File (PDF or Image)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,application/pdf"
            required
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? "Extracting & Saving..." : "Upload & Extract"}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm text-center">
          {result}
        </div>
      )}
    </div>
  );
}
