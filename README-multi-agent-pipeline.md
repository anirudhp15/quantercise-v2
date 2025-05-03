# Multi-Agent Pipeline Implementation for Quantercise

This document outlines the implementation of a specialized multi-agent pipeline using LangGraph for the Quantercise application.

## Architecture Overview

The new system uses a three-agent pipeline architecture:

1. **Chat Agent**: Generates conversational responses and extracts key information for the educational content.
2. **Preview Agent**: Creates structured educational content based on the extracted information.
3. **Math Validator Agent**: Validates the mathematical accuracy of the generated content.

## Key Components

### 1. Python LangGraph Backend (`langgraph/model.py`)

- **State Management**: Defines a `StatefulChatInput` TypedDict to track state across agent nodes.
- **Agent Nodes**:
  - `chat_agent_node`: Generates conversational content and extracts preview instructions
  - `preview_agent_node`: Creates structured educational content
  - `math_validator_node`: Validates mathematical correctness
- **Conditional Routing**: Uses `should_generate_preview` function to determine if preview generation is needed
- **Graph Definition**: Creates a LangGraph workflow with proper edges between agents

### 2. API Endpoints

- **LangGraph API** (`/api/langgraph/route.ts`):
  - Handles communication with the Python backend
  - Processes structured responses
  - Streams data to the client
- **Chat API** (`/api/chat/route.ts`):
  - Receives user requests
  - Forwards to LangGraph via the orchestration layer
  - Handles structured streaming responses

### 3. TypeScript Orchestration (`/src/lib/langgraph/index.ts`)

- Updated `streamChat` function to handle multi-agent output
- Processes different message types (chat, preview, validation)
- Manages database persistence of conversations and content

### 4. Frontend Handling (`/src/app/dashboard/chats/new/page.tsx`)

- Updated `handleSendMessage` function to process multi-type chunks
- Added state tracking for validation status
- Implements UI updates based on different agent outputs

## Data Flow

1. User sends a message which is received by the Chat API
2. The message is passed to the LangGraph orchestration layer
3. The LangGraph backend executes the agent pipeline:
   - Chat Agent processes the input and extracts key information
   - (Optional) Preview Agent generates structured educational content
   - (Optional) Math Validator checks and corrects mathematical content
4. The frontend receives and handles different message types:
   - `status`: Updates on processing progress
   - `content`: Chat responses
   - `preview`: Structured educational content
   - `validation`: Math validation results and corrections

## Settings Integration

The pipeline integrates with the HighlightedInput component to pass user-configurable settings:

- Content type (worksheet, etc.)
- Grade level (target audience)
- Length (brief, standard, extended)
- Tone (academic, conversational)

These settings influence each agent's behavior, ensuring consistent educational content tailored to the user's specifications.

## Validation and Error Handling

- Each agent has fallback mechanisms for handling errors
- The Math Validator can detect and correct mathematical errors
- Frontend displays validation status for transparency

## Future Improvements

- Add more specialized agents for different content types
- Implement feedback mechanisms to improve agent performance
- Optimize streaming for better performance
- Add support for more educational settings
