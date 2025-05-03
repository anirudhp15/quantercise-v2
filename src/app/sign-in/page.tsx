"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Quantercise</h1>
        <p className="mt-2 text-gray-400">Sign in to your account</p>
      </div>
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900 border border-gray-800 shadow-xl",
              headerTitle: "text-white text-xl",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "border-gray-700 text-white",
              socialButtonsBlockButtonText: "text-white font-normal",
              dividerLine: "bg-gray-800",
              dividerText: "text-gray-500",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              footerActionLink: "text-blue-400 hover:text-blue-300",
              identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
            },
          }}
          routing="path"
          path="/sign-in"
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
