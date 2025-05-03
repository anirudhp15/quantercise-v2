import React from "react";
import { LessonSettings } from "@/types";
import { motion } from "framer-motion";
import {
  Presentation,
  Book,
  FileSpreadsheet,
  Clock,
  MessageCircle,
  Users,
  Gauge,
  Palette,
} from "lucide-react";

// Maps for displaying friendly names
const CONTENT_TYPE_MAP: Record<
  string,
  { icon: React.ReactNode; label: string }
> = {
  worksheet: {
    icon: <FileSpreadsheet className="w-4 h-4" />,
    label: "Worksheet",
  },
  slideshow: { icon: <Presentation className="w-4 h-4" />, label: "Slideshow" },
  lesson_plan: { icon: <Book className="w-4 h-4" />, label: "Lesson Plan" },
  // Add more mappings as needed
};

const GRADE_LEVEL_MAP: Record<string, string> = {
  pk: "Pre-K",
  k: "Kindergarten",
  "1": "1st Grade",
  "2": "2nd Grade",
  "3": "3rd Grade",
  "4": "4th Grade",
  "5": "5th Grade",
  "6": "6th Grade",
  "7": "7th Grade",
  "8": "8th Grade",
  "9": "9th Grade",
  "10": "10th Grade",
  "11": "11th Grade",
  "12": "12th Grade",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
};

const LENGTH_MAP: Record<
  string,
  { icon: React.ReactNode; label: string; time: string }
> = {
  brief: {
    icon: <Clock className="w-4 h-4" />,
    label: "Brief",
    time: "5-10 mins",
  },
  standard: {
    icon: <Clock className="w-4 h-4" />,
    label: "Standard",
    time: "15-30 mins",
  },
  extended: {
    icon: <Clock className="w-4 h-4" />,
    label: "Extended",
    time: "30-60 mins",
  },
};

const TONE_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  simplified: { icon: <MessageCircle className="w-4 h-4" />, label: "Simple" },
  academic: { icon: <MessageCircle className="w-4 h-4" />, label: "Academic" },
  conversational: {
    icon: <MessageCircle className="w-4 h-4" />,
    label: "Conversational",
  },
};

interface PreviewSettingsProps {
  settings: LessonSettings | null;
  layout?: "vertical" | "horizontal";
}

export const PreviewSettings: React.FC<PreviewSettingsProps> = ({
  settings,
  layout = "vertical",
}) => {
  if (!settings) {
    return null;
  }

  const { contentType, gradeLevel, length, tone } = settings;

  const settingsItems = [
    {
      icon: CONTENT_TYPE_MAP[contentType]?.icon || (
        <FileSpreadsheet className="w-4 h-4" />
      ),
      label:
        CONTENT_TYPE_MAP[contentType]?.label || contentType || "Unknown Type",
      value: contentType,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: GRADE_LEVEL_MAP[gradeLevel] || gradeLevel || "Unknown Grade",
      value: gradeLevel,
    },
    {
      icon: <Gauge className="w-4 h-4" />,
      label: LENGTH_MAP[length]?.label || length || "Standard Length",
      value: length,
    },
    {
      icon: <Palette className="w-4 h-4" />,
      label: TONE_MAP[tone]?.label || tone || "Academic Tone",
      value: tone,
    },
  ];

  if (layout === "horizontal") {
    return (
      <motion.div
        className="flex items-center space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {settingsItems.map(
          (item, index) =>
            item.value && (
              <div
                key={index}
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/70 border border-gray-700/50 rounded-md text-xs text-gray-300"
                title={item.label}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            )
        )}
      </motion.div>
    );
  } else {
    return (
      <motion.div
        className="mt-4 space-y-2 border-t border-gray-800 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          Content Settings
        </h4>
        {settingsItems.map(
          (item, index) =>
            item.value && (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <span className="text-gray-500">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
        )}
      </motion.div>
    );
  }
};
