"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [title, setTitle] = useState("Debug conversation");

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversations directly from Supabase
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          throw error;
        }

        setConversations(data || []);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to fetch conversations");
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const createConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          title,
          mode: "student",
          user_id: `anonymous-${crypto.randomUUID()}`,
          clerk_id: `debug-${Date.now()}`,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("Created conversation:", data);

      // Refresh the list
      const { data: updatedData, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setConversations(updatedData || []);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  const clearConversations = async () => {
    if (!confirm("Are you sure you want to delete all conversations?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete all conversations
      const { error } = await supabase
        .from("conversations")
        .delete()
        .neq("id", "placeholder");

      if (error) {
        throw error;
      }

      setConversations([]);
    } catch (err) {
      console.error("Error clearing conversations:", err);
      setError("Failed to clear conversations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug: Conversations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Create New Conversation</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
            placeholder="Conversation title"
          />
          <button
            onClick={createConversation}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Conversations ({conversations.length})
        </h2>
        <button
          onClick={clearConversations}
          disabled={loading || conversations.length === 0}
          className="bg-red-500 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
        >
          Clear All
        </button>
      </div>

      {loading && <p>Loading...</p>}

      <div className="space-y-2">
        {conversations.map((conv) => (
          <div key={conv.id} className="border rounded p-4 bg-white">
            <div className="flex justify-between">
              <h3 className="font-medium">{conv.title}</h3>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                {conv.mode}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 grid grid-cols-2 gap-2">
              <div>
                <strong>ID:</strong> {conv.id}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(conv.created_at).toLocaleString()}
              </div>
              <div>
                <strong>User ID:</strong> {conv.user_id}
              </div>
              <div>
                <strong>Clerk ID:</strong> {conv.clerk_id || <em>empty</em>}
              </div>
            </div>
          </div>
        ))}

        {!loading && conversations.length === 0 && (
          <p className="text-gray-500 italic">No conversations found</p>
        )}
      </div>
    </div>
  );
}
