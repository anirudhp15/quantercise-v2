# Multi-Agent LangGraph Architecture for Quantercise

This document outlines the implementation of the new multi-agent LangGraph architecture for Quantercise's AI chat pipeline.

## Architecture Overview

The new system uses a four-agent pipeline architecture:

1. **ChatAgent**: Interprets user intent and requests, generating conversational responses.
2. **RetrieverAgent**: Fetches relevant mathematical context from Supabase vector embeddings.
3. **PreviewAgent**: Creates structured educational content based on the user's request and retrieved context.
4. **ValidationAgent**: Validates the mathematical accuracy and educational quality of the generated content.

## Components

### 1. API Endpoints

#### New V2 Endpoint

- **Path**: `/api/chat/v2`
- **Purpose**: Handles the multi-agent pipeline processing
- **Implementation**: `src/app/api/chat/v2/route.ts`

#### Default Chat Router

- **Path**: `/api/chat`
- **Purpose**: Routes requests to v2 by default, with fallback to v1
- **Implementation**: `src/app/api/chat/route.ts`

#### LangSmith Testing Endpoint

- **Path**: `/api/langsmith`
- **Purpose**: Facilitates testing and viewing traces in LangSmith
- **Implementation**: `src/app/api/langsmith/route.ts`

### 2. Multi-Agent Implementation

- **Core Implementation**: `src/lib/langgraph/multi-agent.ts`
- **State Management**: Uses LangGraph's StateGraph for managing the flow between agents
- **Agents**:
  - `chatAgent`: Understands user intent
  - `retrieverAgent`: Retrieves mathematical context
  - `previewAgent`: Generates content
  - `validationAgent`: Validates accuracy

### 3. Frontend Integration

- **Main Chat UI**: `src/app/dashboard/chats/new/page.tsx`
- **Preview Component**: `src/components/preview/PreviewPane.tsx`
- **Response Handling**: Processes multi-step agent outputs and renders them appropriately

## Request/Response Flow

### Request Format (v2)

```json
{
  "message": "Generate a worksheet on solving quadratic equations by factoring",
  "threadId": "optional-thread-id",
  "images": [],
  "mode": "student",
  "settings": {
    "contentType": "worksheet",
    "gradeLevel": "8",
    "length": "standard",
    "tone": "academic"
  },
  "useV1Fallback": true
}
```

### Response Format (v2)

Each part of the multi-agent process streams a different type of response:

```json
{ "type": "threadId", "threadId": "uuid-thread-id" }
```

```json
{ "type": "status", "currentStep": 0, "message": "Analyzing your request..." }
```

```json
{
  "type": "chat",
  "content": "I'll create a worksheet on solving quadratic equations by factoring for 8th grade students."
}
```

```json
{
  "type": "context",
  "content": "# Quadratic Equations by Factoring\n\n## Core Concepts\n- A quadratic equation has the form $ax^2 + bx + c = 0$\n- When $a = 1$, factoring is simplest\n- etc."
}
```

```json
{
  "type": "preview_update",
  "presentationContent": "# Quadratic Equations Worksheet\n\n## Objectives\n\n..."
}
```

```json
{
  "type": "validation_result",
  "validation": {
    "status": "valid",
    "errors": [],
    "suggestions": ["Consider adding more visual examples"]
  }
}
```

## Using the New Architecture

### Automatic Routing

By default, all requests to `/api/chat` are now routed to the v2 endpoint. To explicitly use the v1 endpoint, set `useV1: true` in your request.

### Handling Responses

The frontend needs to handle the different response types:

- `threadId`: Update thread ID in state
- `status`: Update progress bar/indicators
- `chat`: Display as conversational message
- `context`: Show in collapsible context panel
- `preview_update`: Update preview content
- `validation_result`: Display validation status and any errors

### Error Handling and Recovery

The system has built-in fallback mechanisms:

1. If v2 endpoint returns an error status, it automatically falls back to v1
2. If an agent fails, the error is captured and returned with `fallbackToV1: true`
3. Each agent can handle partial success, continuing the pipeline with available information

## Testing with LangSmith

### Configuration

1. Set the following environment variables:

   ```
   LANGCHAIN_API_KEY=your_langchain_api_key
   LANGCHAIN_PROJECT=quantercise-v2
   LANGSMITH_API_KEY=your_langsmith_api_key
   LANGSMITH_PROJECT_ID=your_project_id
   ```

2. Use the LangSmith testing endpoint:

   ```bash
   curl -X POST http://localhost:3000/api/langsmith \
     -H "Content-Type: application/json" \
     -d '{"message": "Generate a worksheet on quadratics"}'
   ```

3. View the trace in the LangSmith dashboard at `https://smith.langchain.com/project/[your_project_id]`

### Key Metrics to Monitor

- **Token Usage**: Track tokens per agent to optimize costs
- **Agent Latency**: Monitor each agent's processing time
- **Error Rates**: Track validation errors and agent failures
- **Context Quality**: Evaluate relevance of retrieved content
- **Validation Accuracy**: Review validation agent effectiveness

## Best Practices for Versioning

1. **Maintain Both Endpoints**: Keep both v1 and v2 endpoints active during the transition
2. **Gradual Rollout**: Enable v2 for a subset of users before full deployment
3. **Feature Flags**: Use flags to control which users get which version
4. **Telemetry**: Add detailed logging to compare performance between versions
5. **Fallback Mechanism**: Always provide a way to fall back to the original implementation

## Future Improvements

1. **Vector Database Integration**: Enhance RetrieverAgent with proper Supabase vector query
2. **Content Refinement**: Add a refinement step after validation failures
3. **Parallel Processing**: Run retrieval and chat agents in parallel for speed
4. **Streaming Enhancements**: Improve streaming for large content generation
5. **LangSmith Integration**: Add deeper tracing and evaluation

## Troubleshooting

### Common Issues

1. **Agent Timeouts**: If an agent takes too long, check your model configuration and prompt complexity
2. **Validation Errors**: Check if math content is grade-appropriate and verify formulas
3. **Context Relevance**: If retrieved context is poor, check vector database and embedding quality
4. **Response Format Issues**: Ensure JsonOutputParser is working correctly for structured data

### Debugging

Use the LangSmith dashboard to inspect the full execution trace of each agent, including:

- Input/output for each step
- Token usage and latency
- Internal agent state transitions
- Error messages and stack traces
