"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Boxes,
} from "lucide-react";

const Footer = () => {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Info", href: "#details" },
        { label: "Pricing", href: "#pricing" },
        { label: "Our Mission", href: "/goal" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "#" },
        { label: "Tutorials", href: "#" },
        { label: "FAQs", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#footer" },
      ],
    },
  ];

  const socialLinks = [
    {
      name: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      href: "https://instagram.com/quantercise",
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-5 w-5" />,
      href: "https://x.com/quantercise",
    },
    {
      name: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      href: "https://facebook.com/quantercise",
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      href: "https://linkedin.com/company/quantercise",
    },
    {
      name: "Email",
      icon: <Mail className="h-5 w-5" />,
      href: "mailto:quantercise@gmail.com",
    },
  ];

  // Helper function for smooth scrolling
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <footer
      id="footer"
      className="border-t-2 border-gray-700/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12"
        >
          {/* Brand column */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Boxes className="h-6 w-6 text-primary" />
              <span className="font-bold tracking-tighter text-primary text-xl">
                Quantercise
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Empowering students to tackle advanced math before high school—the
              future is about thinking sharp.
            </p>

            <motion.div
              variants={containerVariants}
              className="flex space-x-4 mt-6"
            >
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  variants={itemVariants}
                  aria-label={social.name}
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Link columns */}
          {footerLinks.map((column) => (
            <motion.div
              key={column.title}
              variants={itemVariants}
              className="space-y-4"
            >
              <h3 className="font-medium text-primary/90 text-sm uppercase tracking-wider">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <motion.li key={link.label} variants={itemVariants}>
                    {link.href.startsWith("#") ? (
                      <button
                        onClick={() => scrollTo(link.href.substring(1))}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-gray-800/40 flex flex-col md:flex-row justify-between items-center"
        >
          <motion.p
            variants={itemVariants}
            className="text-sm text-muted-foreground"
          >
            © {new Date().getFullYear()} Quantercise • All rights reserved
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex space-x-6 mt-4 md:mt-0"
          >
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
