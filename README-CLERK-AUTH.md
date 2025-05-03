# Clerk Authentication Integration Guide

This guide will help you set up Clerk authentication for your Quantercise application while continuing to use Supabase for database functionality.

## Step 1: Sign Up for Clerk

1. Go to [clerk.com](https://clerk.com/) and sign up for an account
2. Create a new application in the Clerk dashboard
3. Set up your application with the settings that match your requirements (social logins, etc.)

## Step 2: Get Your API Keys

1. In your Clerk dashboard, go to "API Keys"
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Step 3: Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```
# Existing Supabase variables (kept for database functionality)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Auth Environment Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk route configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Step 4: Update Supabase Database Schema

To link Clerk users with Supabase, modify your profiles table schema:

```sql
-- Update profiles table to use clerk_id as primary key
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT
);

-- Update existing RLS policies to use clerk_id
CREATE POLICY "Users can select their own profile"
  ON profiles FOR SELECT
  USING (clerk_id = (SELECT clerk_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (clerk_id = (SELECT clerk_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (clerk_id = (SELECT clerk_id FROM auth.users WHERE id = auth.uid()));
```

## Step 5: Deploy to Vercel

When deploying to Vercel, make sure to:

1. Add all the Clerk environment variables in your Vercel project settings
2. Configure the Clerk webhook URL in the Clerk dashboard to point to your deployed application

## Troubleshooting

If you encounter any issues:

1. **Check environment variables**: Ensure all environment variables are correctly set up
2. **Verify Clerk webhooks**: Make sure webhooks are properly configured
3. **Check browser console**: Look for any errors in the browser console
4. **Test locally first**: Make sure everything works locally before deploying
5. **Clerk documentation**: Refer to the [Clerk documentation](https://clerk.com/docs) for detailed guidance

## Migrating Existing Users

To migrate existing users:

1. Export user data from Supabase (email, hashed passwords, etc.)
2. Import users into Clerk using their [User Migration API](https://clerk.com/docs/users/user-migration)
3. Update your profiles table to include clerk_id for all existing users
