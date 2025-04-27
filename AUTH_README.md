# Quantercise Authentication Setup

This document provides a comprehensive guide to the Supabase authentication setup for Quantercise.

## Environment Variables

The following environment variables are required for authentication to work properly:

```
NEXT_PUBLIC_SUPABASE_URL=https://resekcyogqnrgrhqqczf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlc2VrY3lvZ3FucmdyaHFxY3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NzQ4MzEsImV4cCI6MjA2MTM1MDgzMX0.LFY8XAoCEMEM1nNoy_0sRH7c3C6BCk7QMawg7MY87lg
```

You can set these up by running:

```bash
npm run setup-env
```

## Vercel Deployment

When deploying to Vercel, ensure that the environment variables are correctly set up in your project settings. The `vercel.json` file already includes the necessary configuration, but you should verify that the values are correct in your Vercel dashboard.

## Supabase Database Schema

The authentication system relies on the following database schema:

### Profiles Table

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT
);
```

### Row Level Security Policies

```sql
-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Profile Creation Trigger

```sql
-- Create or replace the function
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

### Storage Bucket and Policies

```sql
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Avatar access policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
```

## Authentication Flow

1. **Sign Up**: Users can sign up at `/auth/signup` with email, password, and full name.
2. **Email Verification**: After signup, users are directed to a verification page. They need to check their email and click the verification link.
3. **Sign In**: Users can sign in at `/auth/login` with email and password.
4. **Password Reset**: If a user forgets their password, they can request a reset at `/auth/reset-password`.
5. **Protected Routes**: Routes under `/dashboard/*` are protected and require authentication. Unauthenticated users will be redirected to the login page.

## Testing Authentication

To test if authentication is working properly, you can:

1. Visit `/test-auth` to check your authentication status
2. Visit `/test-db` to check database connection and permissions
3. Try signing up with a new account
4. Verify that you can log in with the new account
5. Test the password reset flow
6. Verify that protected routes require authentication

## Troubleshooting

If you encounter issues with authentication:

### Empty Error Object During Signup: `Error: Error signing up: {}`

This error typically occurs when:

1. **Database Connectivity Issues**:

   - The connection to Supabase database might be failing
   - Try the "Test Connection" button on the signup page to verify database connectivity
   - Run the `supabase-fix.sql` script in your Supabase SQL Editor to ensure tables are properly set up

2. **Missing Profiles Table or Permissions**:

   - Check if the profiles table exists in your Supabase dashboard
   - Make sure Row Level Security (RLS) is properly configured
   - Ensure the trigger for creating user profiles is working

3. **CORS Issues**:

   - Check if your domain is allowed in Supabase Auth settings
   - In your Supabase dashboard, go to Authentication > URL Configuration
   - Add your site's domain to the Site URL and Redirect URLs

4. **Email Provider Issues**:

   - Supabase may have email sending limits or restrictions
   - Check Email Templates in your Supabase Authentication settings

5. **Environment Variables**:
   - Verify that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set
   - These should match exactly with your Supabase project details

### Password Requirements

Supabase enforces a minimum password length of 6 characters. If users are trying to sign up with shorter passwords, they will receive an error.

### Other Common Issues

1. **Check Environment Variables**: Ensure your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set in both your local environment and on Vercel.

2. **Verify Database Schema**: Make sure the profiles table and necessary policies are created in your Supabase database.

3. **Check Network Requests**: In your browser's developer tools, look for any failed requests to Supabase endpoints.

4. **Server-Side Rendering**: If you're seeing hydration errors, ensure that your authentication components use the "use client" directive.

5. **Cookies**: Authentication relies on cookies. Make sure cookies are enabled in your browser.

## Updating Authentication

If you need to update the authentication system:

1. **Supabase Client**: The Supabase client is initialized in `src/lib/supabase.ts`.
2. **Auth Context**: The authentication context provider is in `src/lib/auth-context.tsx`.
3. **Middleware**: Route protection is handled in `src/middleware.ts`.
4. **Auth Pages**: Authentication-related pages are in `src/app/auth/`.

## Security Considerations

- The service role key should be kept secret and only used for server-side operations.
- All client-side operations should use the anon key.
- Row Level Security policies ensure users can only access their own data.
- Email verification helps prevent fake accounts.
