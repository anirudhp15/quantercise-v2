import React, { useState, forwardRef } from "react";
import { HighlightedInput } from "./highlighted-input";
import { LessonSettings } from "@/types";

interface HighlightedInputWithSettingsProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSettingsChange?: (settings: LessonSettings) => void;
}

/**
 * A wrapper component that adds default settings to HighlightedInput
 * and manages the instructions visibility state
 */
export const HighlightedInputWithSettings = forwardRef<
  HTMLTextAreaElement,
  HighlightedInputWithSettingsProps
>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder,
      disabled,
      className,
      onSettingsChange,
    },
    ref
  ) => {
    // Local state for instructions visibility
    const [showInstructions, setShowInstructions] = useState(false);

    // The default settings
    const defaultSettings: LessonSettings = {
      contentType: "worksheet",
      gradeLevel: "8",
      length: "standard",
      tone: "academic",
    };

    // Handler for settings changes
    const handleSettingsChange = (newSettings: LessonSettings) => {
      // Pass settings up to parent component
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }

      // Close the instructions panel after settings are applied
      setShowInstructions(false);
    };

    return (
      <HighlightedInput
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        showInstructions={showInstructions}
        onShowInstructionsChange={setShowInstructions}
        onSettingsChange={handleSettingsChange}
      />
    );
  }
);

HighlightedInputWithSettings.displayName = "HighlightedInputWithSettings";
