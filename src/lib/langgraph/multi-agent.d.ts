import { LessonSettings } from "@/types";
import { StateGraph } from "@langchain/langgraph";
import { RunnableLambda } from "@langchain/core/runnables";

// Define the interface for the MultiAgentState
export interface MultiAgentState {
  messages: any[];
  threadId?: string;
  clerkId?: string;
  mode: "student" | "teacher";
  settings: LessonSettings;
  userInput: string;
  chatOutput?: string;
  retrievedContext?: string[];
  previewContent?: string;
  validationResult?: {
    status: "valid" | "errors_found" | "validation_error";
    errors?: Array<{
      error_detail: string;
      location?: string;
      correction?: string;
    }>;
    suggestions?: string[];
  };
  finalOutput?: string;
  error?: string;
}

// Declare the RunnableLambda types
export declare const chatAgent: RunnableLambda<
  MultiAgentState,
  AsyncGenerator<any, Partial<MultiAgentState>, void>
>;
export declare const retrieverAgent: RunnableLambda<
  MultiAgentState,
  AsyncGenerator<any, Partial<MultiAgentState>, void>
>;
export declare const previewAgent: RunnableLambda<
  MultiAgentState,
  AsyncGenerator<any, Partial<MultiAgentState>, void>
>;
export declare const validationAgent: RunnableLambda<
  MultiAgentState,
  AsyncGenerator<any, Partial<MultiAgentState>, void>
>;

// Declare the workflow creation function
export declare function createMultiAgentGraph(): any;

// Declare the streamMultiAgentChat function
export declare function streamMultiAgentChat(
  input: string,
  history?: { role: string; content: string }[],
  options?: {
    mode?: "student" | "teacher";
    threadId?: string;
    createNewThread?: boolean;
    clerkId?: string;
    structuredOutput?: boolean;
    settings?: LessonSettings;
    useV1Fallback?: boolean;
  }
): AsyncGenerator<string, void, unknown>;
