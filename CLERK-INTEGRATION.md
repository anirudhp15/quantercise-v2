# Clerk Authentication Integration

This document summarizes the changes made to replace Supabase Authentication with Clerk, while continuing to use Supabase for database functionality.

## Completed Changes

1. **Installed Required Dependencies**:

   - `@clerk/nextjs`
   - `svix` (for webhook handling)

2. **Basic Clerk Configuration**:

   - Created sign-in and sign-up pages with Clerk components
   - Set up middleware to protect routes
   - Updated root layout with `ClerkProvider`
   - Created a webhook handler to sync user data with Supabase

3. **Database Integration**:

   - Created helper functions to manage Supabase user profiles with Clerk IDs
   - Prepared SQL migration scripts for database schema updates
   - Updated the `supabase.ts` client to only handle database operations

4. **UI Updates**:

   - Updated the Navbar with Clerk authentication buttons
   - Added Clerk components to the home page
   - Modified dashboard pages to use Clerk user data

5. **User Context**:
   - Created a custom hook (`useClerkSupabase`) to provide unified access to both Clerk user data and Supabase profile data

## Remaining Tasks

1. **Environment Variables**:

   - Set up the required Clerk environment variables in `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
     CLERK_SECRET_KEY=your_clerk_secret_key
     NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
     NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
     NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
     NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
     CLERK_WEBHOOK_SECRET=your_webhook_secret
     ```

2. **Clerk Dashboard Setup**:

   - Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
   - Configure the authentication methods and social providers
   - Set up webhooks to point to your `/api/webhooks/clerk` endpoint
   - Copy API keys to your environment variables

3. **Database Migration**:

   - Run the SQL migration scripts in `sql/clerk-migration.sql` using the Supabase SQL Editor
   - Test that the database schema updates work correctly

4. **Remove Old Auth Files**:

   - Delete or update the following files related to Supabase auth:
     - `src/lib/auth-context.tsx` (replaced by Clerk)
     - `src/app/auth/**/*` (Supabase auth pages, replaced by Clerk)
     - `src/app/auth-test/page.tsx`, `src/app/debug-auth/page.tsx`, `src/app/test-auth/page.tsx` (if they're no longer needed)

5. **Update API Routes**:

   - Modify any API routes to use Clerk authentication instead of Supabase
   - Update database queries to use `clerk_id` fields

6. **Testing**:
   - Test sign-up flow
   - Test sign-in flow
   - Test protected routes
   - Test database operations with Clerk user IDs

## Useful Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js + Clerk Integration Guide](https://clerk.com/docs/references/nextjs/overview)
- [Protecting Routes in Next.js](https://clerk.com/docs/references/nextjs/protecting-routes)
- [User Data in API Routes](https://clerk.com/docs/references/nextjs/user-data-in-api-routes)
- [Webhooks Configuration](https://clerk.com/docs/integrations/webhooks)

## Troubleshooting

If you encounter issues:

1. **Check Browser Console**: Look for JavaScript errors
2. **Inspect Network Requests**: Check for failed API calls
3. **Verify Environment Variables**: Ensure all required variables are set
4. **Check Webhook Logs**: In the Clerk dashboard, check webhook delivery logs
5. **Database Queries**: Verify queries are using the correct field names (e.g., `clerk_id` vs `user_id`)
