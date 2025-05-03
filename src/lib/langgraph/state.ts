import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
// import { LessonSettings } from "@/types"; // Assuming your LessonSettings type is here - moved definition locally
import { END } from "@langchain/langgraph";

// Define LessonSettings locally for now if not properly exported from @/types
export interface LessonSettings {
  contentType: string;
  gradeLevel: string;
  length: string;
  tone: string;
}

// Define the structure of the validation result
export interface ValidationResult {
  status: "valid" | "errors_found" | "validation_error";
  errors?: Array<{
    error_detail: string;
    location?: string;
    correction?: string;
  }>;
  suggestions?: string[];
}

// Define the state for the graph
export interface GraphState {
  messages: BaseMessage[]; // List of messages in the conversation
  userInput: string; // The latest user input
  settings: {
    contentType: string;
    gradeLevel: string;
    length: string;
    tone: string;
  };
  threadId?: string; // Add threadId to state
  plan?: string; // The generated plan for content creation
  draftContent?: string; // The initial generated content
  validation?: ValidationResult; // Add validation field
  finalContent?: string; // The final, formatted content for the preview
  retryCount: number; // To prevent infinite refinement loops
  presentationContent?: string;
  metadata?: {
    validationStatus?: string;
    validationErrors?: string[];
    timestamp?: string;
  };
}

// Helper function to add the latest user input to the message list
// Revert to returning Partial<GraphState>
export const addHumanMessage = (state: GraphState): Partial<GraphState> => {
  if (!state.userInput) return {}; // Return empty object if no change
  return {
    messages: (state.messages ?? []).concat(new HumanMessage(state.userInput)),
    userInput: "", // Clear user input after adding
  };
};

// Function to decide the next step after validation
export const decideValidationPath = (
  state: GraphState
): "refiner" | "formatter" => {
  if (!state.validation) {
    // Should not happen if validator ran, but default to formatter
    console.warn("Validation result missing, proceeding to formatter.");
    return "formatter";
  }

  if (
    state.validation.status === "errors_found" &&
    state.retryCount < 3 // Limit retries
  ) {
    console.log("Validation found errors. Proceeding to refiner.");
    return "refiner";
  } else {
    if (state.validation.status === "errors_found") {
      console.warn(
        `Max refinement retries (${state.retryCount}) reached. Proceeding to formatter despite errors.`
      );
    } else {
      console.log(
        "Validation passed or retries exhausted. Proceeding to formatter."
      );
    }
    return "formatter";
  }
};
