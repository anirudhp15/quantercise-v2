"use client";

import React from "react";
import { motion } from "framer-motion";

const DemoSection = () => {
  const container = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 * i, duration: 0.6 },
    }),
  };

  return (
    <section
      id="details"
      className="py-16 sm:py-20 md:py-24 px-2 text-white bg-gradient-to-b from-gray-900/5 via-black to-gray-900/5"
    >
      <div className="container mx-auto max-w-screen-xl space-y-12 sm:space-y-16">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl sm:text-3xl md:text-5xl max-w-4xl mx-auto font-bold text-center"
        >
          Quantercise provides shortcuts for{" "}
          <span className="text-blue-300">teachers</span> and{" "}
          <span className="text-green-300">students</span>.
        </motion.h2>

        {/* Student Feature */}
        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={container}
          className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8"
        >
          {/* video */}
          <div className="flex-1 w-full">
            <div className="relative aspect-video rounded-2xl bg-gray-800 overflow-hidden shadow-xl">
              {/* placeholder grid */}
              {/* <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" /> */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-12 sm:w-16 h-12 sm:h-16 text-white/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.5 5.65a1.48 1.48 0 012.78-1.64l11.54 6.35a1.48 1.48 0 010 2.57l-11.54 6.35A1.48 1.48 0 014.5 18.35V5.65z" />
                </svg>
              </div>
            </div>
          </div>
          {/* text */}
          <div className="flex-1 space-y-3 sm:space-y-4 max-w-lg ">
            <h3 className="text-2xl sm:text-3xl text-blue-300 font-bold">
              For teachers
            </h3>
            <p className="text-xs sm:text-base text-gray-300">
              Auto-generate accurate slides, worksheets, and step-by-step
              solutions so you spend less time prepping and more time teaching.
            </p>
          </div>
        </motion.div>

        {/* Teacher Feature */}
        <motion.div
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={container}
          className="flex flex-col lg:flex-row-reverse items-center gap-6 sm:gap-8"
        >
          {/* video */}
          <div className="flex-1 w-full">
            <div className="relative aspect-video rounded-2xl bg-gray-800 overflow-hidden shadow-xl">
              {/* <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" /> */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-12 sm:w-16 h-12 sm:h-16 text-white/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.5 5.65a1.48 1.48 0 012.78-1.64l11.54 6.35a1.48 1.48 0 010 2.57l-11.54 6.35A1.48 1.48 0 014.5 18.35V5.65z" />
                </svg>
              </div>
            </div>
          </div>
          {/* text */}
          <div className="flex-1 space-y-3 sm:space-y-4 max-w-lg">
            <h3 className="text-2xl sm:text-3xl text-green-300 font-bold">
              For students
            </h3>
            <p className="text-xs sm:text-base text-gray-300">
              Just{" "}
              <span className="p-1 bg-gray-700 text-white rounded-md">@</span>{" "}
              any topic to instantly pull aligned content from our full K–12
              math curriculum—so you're always learning what actually matters.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
