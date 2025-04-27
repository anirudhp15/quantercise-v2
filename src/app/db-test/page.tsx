"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DBTestPage() {
  const [status, setStatus] = useState("Checking database...");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setStatus("Testing database connection...");

      // Test overall connection
      const { data: countData, error: countError } = await supabase
        .from("profiles")
        .select("count");

      if (countError) {
        throw countError;
      }

      // Get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      if (profilesError) {
        throw profilesError;
      }

      setProfiles(profilesData || []);
      setStatus(
        `Connected to database. Found ${profilesData?.length || 0} profiles.`
      );

      // Get user count from auth schema - using raw query since it's outside our schema
      try {
        // We can't directly access auth.users through the typed client
        // Use a safer approach by executing a count query for all profiles
        const { count, error: userCountError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        if (!userCountError) {
          setUserCount(count || 0);
        }
      } catch (err) {
        console.log("Could not get user count");
      }

      // Get table info - skip this since it requires a custom function
      // Try getting column info instead
      try {
        // Just list a sample profile to see schema, easier than using RPC
        const { data: sampleProfile } = await supabase
          .from("profiles")
          .select("*")
          .limit(1)
          .single();

        if (sampleProfile) {
          // Use type assertion to avoid TypeScript errors with dynamic access
          const sampleProfileObj = sampleProfile as Record<string, any>;

          setTableInfo({
            columns: Object.keys(sampleProfileObj).map((key) => ({
              name: key,
              sample_value: sampleProfileObj[key],
            })),
          });
        }
      } catch (err) {
        console.log("Could not get table schema information");
      }
    } catch (err: any) {
      console.error("Database test error:", err);
      setError(err.message || "Unknown database error");
      setStatus("Database connection failed");
    }
  };

  const createTestProfile = async () => {
    try {
      setStatus("Creating test profile...");

      const testData = {
        id: crypto.randomUUID(),
        full_name: "Test User " + new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert(testData)
        .select();

      if (error) {
        throw error;
      }

      setStatus(`Test profile created: ${data?.[0]?.id}`);
      await checkDatabase();
    } catch (err: any) {
      console.error("Profile creation error:", err);
      setError(`Profile creation failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-3xl space-y-8 bg-gray-800 p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Database Test</h1>
          <div className="space-x-2">
            <Button
              onClick={checkDatabase}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh
            </Button>
            <Button
              onClick={createTestProfile}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Test Profile
            </Button>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-white">
            Connection Status
          </h2>
          <p className="text-green-400">{status}</p>
          {error && <p className="text-red-400 mt-2">Error: {error}</p>}
        </div>

        {tableInfo && (
          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-lg font-semibold text-white">Table Schema</h2>
            <pre className="text-xs text-blue-300 mt-2 overflow-auto max-h-48">
              {JSON.stringify(tableInfo, null, 2)}
            </pre>
          </div>
        )}

        {userCount !== null && (
          <div className="bg-gray-700 p-4 rounded">
            <h2 className="text-lg font-semibold text-white">Profile Count</h2>
            <p className="text-green-400">Total profiles: {userCount}</p>
          </div>
        )}

        <div className="bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-white mb-4">
            Profiles ({profiles.length})
          </h2>

          {profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-800">
                      <td className="px-4 py-3 font-mono text-xs">
                        {profile.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        {profile.full_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {profile.created_at
                          ? new Date(profile.created_at).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-yellow-400">
              No profiles found in the database.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-between">
          <Link href="/auth-test">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Auth Test
            </Button>
          </Link>

          <Link href="/auth/signup">
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Create Account
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="text-white border-gray-600">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
