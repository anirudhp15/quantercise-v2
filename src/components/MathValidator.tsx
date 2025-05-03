import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type MathValidatorProps = {
  status: "validating" | "validated" | "error" | "idle";
  className?: string;
};

const MathValidator: React.FC<MathValidatorProps> = ({
  status,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-1 ${className}`}
    >
      {status === "validating" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
          <span className="text-blue-400">Validating math...</span>
        </>
      )}

      {status === "validated" && (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Math validated</span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span className="text-amber-500">Math checked, see corrections</span>
        </>
      )}
    </motion.div>
  );
};

export default MathValidator;
