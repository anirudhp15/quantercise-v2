"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CookieTestPage() {
  const [cookies, setCookies] = useState<string>("");
  const [cookiesList, setCookiesList] = useState<
    { name: string; value: string }[]
  >([]);
  const [hasSbCookies, setHasSbCookies] = useState(false);

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Parse cookies to list
    const cookieArray = allCookies.split(";").map((cookie) => cookie.trim());
    const parsedCookies = cookieArray.map((cookie) => {
      const [name, value] = cookie.split("=");
      return { name, value };
    });

    setCookiesList(parsedCookies);

    // Check if any Supabase cookies exist
    const hasSb = parsedCookies.some(
      (cookie) =>
        cookie.name.includes("sb-") || cookie.name.includes("supabase")
    );

    setHasSbCookies(hasSb);

    console.log("[CookieTest] All cookies:", allCookies);
    console.log("[CookieTest] Parsed cookies:", parsedCookies);
    console.log("[CookieTest] Has Supabase cookies:", hasSb);
  }, []);

  const refreshCookies = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-3xl space-y-8 bg-gray-800 p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Cookie Test</h1>
          <Button
            onClick={refreshCookies}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Refresh
          </Button>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-white">
              Supabase Cookies Status
            </h2>
            <span
              className={`text-sm px-2 py-1 rounded ${
                hasSbCookies
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {hasSbCookies ? "Found" : "Not Found"}
            </span>
          </div>
          <p className="text-sm text-gray-300">
            {hasSbCookies
              ? "Supabase cookies are present. Authentication should work."
              : "No Supabase cookies found. Authentication may fail."}
          </p>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-semibold text-white mb-4">
            Cookies List
          </h2>

          {cookiesList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-2">Cookie Name</th>
                    <th className="px-4 py-2">Value (Preview)</th>
                    <th className="px-4 py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cookiesList.map((cookie, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-200">
                        {cookie.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {cookie.value.length > 30
                          ? `${cookie.value.substring(0, 30)}...`
                          : cookie.value}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            cookie.name.includes("sb-") ||
                            cookie.name.includes("supabase")
                              ? "bg-green-500/20 text-green-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {cookie.name.includes("sb-") ||
                          cookie.name.includes("supabase")
                            ? "Supabase"
                            : "Other"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-red-400">No cookies found!</p>
          )}
        </div>

        <div className="mt-4 flex justify-center flex-col space-y-3">
          <Link href="/auth-test">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Go to Auth Test
            </Button>
          </Link>

          <Link href="/direct-login">
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
              Go to Direct Login
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full text-white border-gray-600"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
