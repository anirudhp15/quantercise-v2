This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Migration Instructions

## Migrating from "conversations" to "threads"

To migrate your database from using "conversations" to "threads", follow these steps:

1. Go to your Supabase dashboard and navigate to the SQL Editor
2. Create a new query
3. Paste in the contents of the `migration-threads-rls.sql` file
4. Run the query

This migration will:

- Rename the "conversations" table to "threads"
- Update the messages table to use "thread_id" instead of "conversation_id"
- Update all row-level security policies accordingly
- Add policies to support anonymous access for development

## Updating API Access

After the migration, you need to:

1. Use `/api/threads` endpoints instead of `/api/conversations`
2. Update all client code to reference "threads" instead of "conversations"

The codebase has already been updated to use the new naming convention.

# Quantercise v2

## LangGraph Studio Integration

This project now includes LangGraph Studio integration for debugging and visualizing the LangGraph workflow:

```bash
# Install the LangGraph CLI (already in package.json)
npm install -D @langchain/langgraph-cli

# Run LangGraph Studio
npm run langgraph
```

The LangGraph Studio provides:

- A visual interface for your LangGraph workflows
- Real-time tracing and debugging capabilities
- State inspection for each node in the graph
- Better debugging of the AI orchestration flow

For detailed usage instructions, see [LangGraph Studio Guide](./docs/langgraph-studio-guide.md).
