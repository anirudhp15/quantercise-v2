"use client";

import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for getting started with Quantercise",
    features: [
      "5 daily lessons",
      "Progress tracking",
      "Community support",
      "Basic analytics",
    ],
    cta: "Get Started",
    href: "/register",
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month",
    description: "For students who want to excel in mathematics",
    features: [
      "All Starter features + advanced exercises",
      "Personalized learning path",
      "Detailed performance analytics",
      "Priority support",
    ],
    cta: "Upgrade Now",
    href: "/pricing/premium",
    featured: true,
  },
  {
    name: "Schools & Districts",
    price: "Custom",
    period: "per year",
    description: "For educational institutions",
    features: [
      "All Premium features",
      "Bulk student accounts",
      "Teacher tools",
      "Custom curriculum",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PricingPage() {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container px-4 sm:px-6"
      >
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-3 sm:mt-4">
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-screen-xl mx-auto">
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={itemVariants}>
              <Card
                className={cn(
                  "relative h-full",
                  plan.featured && "border-primary shadow-lg"
                )}
              >
                <CardHeader>
                  <CardTitle className="flex flex-col items-center">
                    <span className="text-lg sm:text-xl">{plan.name}</span>
                    <div className="mt-3 sm:mt-4">
                      <span className="text-3xl sm:text-4xl font-bold">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center text-sm sm:text-base"
                      >
                        <svg
                          className="h-4 w-4 text-primary mr-3 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full text-sm sm:text-base"
                    variant={plan.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
