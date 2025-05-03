"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Copy,
  Monitor,
  Languages,
  Save,
  Trash2,
  Info,
  ArrowRight,
  Clock,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useClerkSupabase } from "@/lib/hooks/use-clerk-supabase";
import { cn } from "@/lib/utils";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

export default function SettingsPage() {
  const { user } = useClerkSupabase();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-950/75">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-b from-gray-900 to-gray-900/5">
        <div className="container mx-auto px-4 max-w-7xl py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-2 text-center mb-8"
          >
            <p className="text-sm uppercase tracking-wider text-gray-400">
              Personalize your experience
            </p>
            <h1 className="text-4xl font-bold text-white">Account Settings</h1>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Profile Settings */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-white text-xl">
                    Profile Information
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Update your personal details and public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Your first name"
                      defaultValue={user?.firstName || ""}
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Your last name"
                      defaultValue={user?.lastName || ""}
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    defaultValue={user?.emailAddresses[0]?.emailAddress || ""}
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    Your email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50 min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-900/30 border-t border-gray-800 flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                >
                  {saving && (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-opacity-20 border-t-white rounded-full" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-white text-xl">Security</CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Manage your account security and authentication options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-gray-300">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-gray-300">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500/50"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label htmlFor="two-factor" className="text-gray-300">
                      Two-Factor Authentication
                    </Label>
                    <p className="text-xs text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    id="two-factor"
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-900/30 border-t border-gray-800 flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                >
                  {saving && (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-opacity-20 border-t-white rounded-full" />
                  )}
                  Update Security
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-white text-xl">
                    Appearance
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Customize how Quantercise looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <Label className="text-gray-300">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {["Dark", "Light", "System"].map((theme) => (
                      <div
                        key={theme}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all",
                          theme === "Dark"
                            ? "bg-gray-800 border-blue-500/50 shadow-sm shadow-blue-500/10"
                            : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">{theme}</span>
                          {theme === "Dark" && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label htmlFor="compact-mode" className="text-gray-300">
                      Compact Mode
                    </Label>
                    <p className="text-xs text-gray-500">
                      Use a more dense layout with less padding
                    </p>
                  </div>
                  <Switch
                    id="compact-mode"
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label htmlFor="animations" className="text-gray-300">
                      UI Animations
                    </Label>
                    <p className="text-xs text-gray-500">
                      Enable motion animations throughout the interface
                    </p>
                  </div>
                  <Switch
                    id="animations"
                    defaultChecked
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-900/30 border-t border-gray-800 flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600"
                >
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                >
                  {saving && (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-opacity-20 border-t-white rounded-full" />
                  )}
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  <CardTitle className="text-white text-xl">
                    Notifications
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Control when and how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label
                      htmlFor="email-notifications"
                      className="text-gray-300"
                    >
                      Email Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive updates and alerts via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    defaultChecked
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label
                      htmlFor="push-notifications"
                      className="text-gray-300"
                    >
                      Push Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive alerts in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 pb-1">
                  <div className="space-y-1">
                    <Label
                      htmlFor="marketing-notifications"
                      className="text-gray-300"
                    >
                      Marketing Updates
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive product news and updates
                    </p>
                  </div>
                  <Switch
                    id="marketing-notifications"
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-900/30 border-t border-gray-800 flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600"
                >
                  Disable All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                >
                  {saving && (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-opacity-20 border-t-white rounded-full" />
                  )}
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="bg-gray-900/50 border border-red-900/20 rounded-xl shadow-lg overflow-hidden">
              <CardHeader className="bg-red-950/30 border-b border-red-900/20">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <CardTitle className="text-white text-xl">
                    Danger Zone
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-400">
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-200">
                          Export Data
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Download all your data and content
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-600"
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-200">
                          Delete Account
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        className="bg-red-600/80 hover:bg-red-600 text-white"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
