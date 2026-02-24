import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, Flag, Lock } from "lucide-react";

const ActionButtons = () => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg font-semibold text-sm shadow-lg shadow-destructive/20 transition-all border border-destructive/20"
        >
          <Flag className="w-4 h-4" />
          Report Phishing
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold text-sm border border-border transition-all shadow-lg shadow-secondary/10"
        >
          <Lock className="w-4 h-4" />
          Open Safe Mode
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-safe/10 hover:bg-safe/20 text-safe rounded-lg font-medium text-sm border border-safe/20 hover:border-safe/40 transition-all"
      >
        <ShieldCheck className="w-4 h-4" />
        Mark as Safe
      </motion.button>
    </div>
  );
};

export default ActionButtons;
