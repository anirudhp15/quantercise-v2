"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Clock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerificationPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-gray-950/70 p-8 backdrop-blur"
      >
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-green-500/20 p-3">
            <Mail className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Check your email
          </h1>
          <p className="text-gray-400 max-w-sm">
            We've sent you a verification link to confirm your email address.
            Please check your inbox and click the link to complete your
            registration.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-md bg-gray-800 p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-white">
                  Waiting for verification
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  The verification link will expire after 24 hours. If you don't
                  see the email, please check your spam folder.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-gray-800 p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-white">
                  After verification
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Once you click the verification link, your account will be
                  activated and you'll be able to sign in.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col space-y-3">
          <Link href="/auth/login" className="w-full">
            <Button
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-800 text-white"
            >
              Go to login
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-500">
              Return to home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
