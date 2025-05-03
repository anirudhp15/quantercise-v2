# LangGraph Studio Guide

## Setup and Installation

LangGraph Studio provides a visual interface for debugging and tracing LangGraph executions. Here's how to use it with the Quantercise v2 project:

### Prerequisites

Make sure you have the necessary dependencies installed:

```bash
npm install -D @langchain/langgraph-cli
```

This is already included in the project dependencies, so you shouldn't need to run this command unless you're setting up a new environment.

## Running LangGraph Studio

We've added a convenience script in the package.json to run LangGraph Studio:

```bash
npm run langgraph
```

This will:

1. Start the LangGraph Studio server with mock environment variables
2. Open the LangGraph API at http://localhost:2024
3. Give you a link to the Studio UI at https://smith.langchain.com/studio?baseUrl=http://localhost:2024

## Using LangGraph Studio

Once the server is running:

1. Open the Studio UI link in your browser
2. You'll see your graph "app" listed
3. Click on it to view the visualization of your LangGraph workflow
4. You can:
   - Trace executions
   - See node inputs and outputs
   - Debug intermediate states
   - Monitor graph execution paths

## Structure of LangGraph in This Project

The main LangGraph components are in the `src/lib/langgraph` directory:

- `graph.ts`: Defines the main graph structure and nodes
- `nodes.ts`: Contains the node implementations
- `state.ts`: Defines the state schema and utilities
- `multi-agent.ts`: Implementation of multi-agent orchestration
- `database.ts`: Utilities for storing and retrieving conversation data

## Advantages of Using LangGraph Studio

- **Visualization**: See how your graph executes in real-time
- **Debugging**: Inspect state transitions between nodes
- **Tracing**: Track conversations and see how they flow through the graph
- **Testing**: Try different inputs and see how they affect the graph execution

## Common Issues and Solutions

### Environment Variables

If you encounter environment variable errors, check that the mock values in `scripts/run-langgraph.js` are sufficient. You may need to adjust them for your specific testing needs.

### Connection Issues

If you can't connect to the Studio UI, ensure:

1. The local server is running (check terminal output)
2. There are no firewall restrictions blocking the connection
3. You're using the correct URL from the terminal output

## Further Resources

- [LangGraph Documentation](https://python.langchain.com/docs/langgraph/)
- [LangGraph JS GitHub](https://github.com/langchain-ai/langgraphjs)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
