const fs = require("fs");
const path = require("path");

// Environment variables
const envVars = `
NEXT_PUBLIC_SUPABASE_URL=https://resekcyogqnrgrhqqczf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlc2VrY3lvZ3FucmdyaHFxY3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NzQ4MzEsImV4cCI6MjA2MTM1MDgzMX0.LFY8XAoCEMEM1nNoy_0sRH7c3C6BCk7QMawg7MY87lg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlc2VrY3lvZ3FucmdyaHFxY3pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc3NDgzMSwiZXhwIjoyMDYxMzUwODMxfQ.qCGUWwLIs_Sg1WHjJXMnoD74Q-R4_IsZHMevCfXo75w
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
`.trim();

// Path to .env.local file
const envPath = path.join(process.cwd(), ".env.local");

// Write to file
fs.writeFileSync(envPath, envVars);

console.log(".env.local file created successfully with Supabase credentials.");
console.log('You can now run "npm run dev" to start the development server.');

// Instructions for Vercel deployment
console.log("\nFor Vercel deployment:");
console.log(
  "1. Make sure to add these environment variables in your Vercel project settings:"
);
console.log("  - NEXT_PUBLIC_SUPABASE_URL");
console.log("  - NEXT_PUBLIC_SUPABASE_ANON_KEY");
console.log(
  "  - SUPABASE_SERVICE_ROLE_KEY (if needed for server-side operations)"
);
console.log(
  "  - SUPABASE_JWT_SECRET (required for Clerk-Supabase token exchange)"
);
console.log("2. Deploy your project with: vercel deploy");
