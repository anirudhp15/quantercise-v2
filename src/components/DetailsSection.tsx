"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const DetailsSection = () => {
  const features = [
    {
      title: "Intuitive Mathematical Learning",
      description:
        "Structured lessons that break down complex mathematical concepts into clear, digestible modules.",
    },
    {
      title: "Interactive Learning Environment",
      description:
        "Dynamic visualizations and hands-on exercises that transform abstract concepts into tangible understanding.",
    },
    {
      title: "Comprehensive Progress Analytics",
      description:
        "Detailed insights and analytics that enable educators and parents to track development and optimize learning paths.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="details" className="py-24 relative overflow-hidden">
      <div className="container max-w-screen-xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="flex flex-col lg:flex-row gap-16 items-start"
        >
          {/* Content side */}
          <div className="flex-1 space-y-8">
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">
                What's Quantercise?
              </h2>
              <p className="text-xl leading-relaxed text-foreground/80 max-w-2xl">
                An advanced mathematics learning platform designed to transform
                complex concepts into accessible knowledge.
              </p>
            </motion.div>

            <motion.ul
              variants={containerVariants}
              className="space-y-4 max-w-2xl"
            >
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  variants={itemVariants}
                  className="flex gap-4"
                >
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xl text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Video placeholder side */}
          <motion.div
            variants={itemVariants}
            className="flex-1 w-full max-w-md lg:max-w-none "
          >
            <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 backdrop-blur-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-10 h-10 text-primary"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-foreground/60 font-medium">
                  Interactive Demo Coming Soon
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default DetailsSection;
