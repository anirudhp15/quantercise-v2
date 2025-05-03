import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DetailsSection from "@/components/DetailsSection";
import { PricingSection } from "@/components/PricingSection";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full bg-black flex-col">
      <ParticlesBackground particleCount={3000}>
        <Navbar />
        <HeroSection />
        <DetailsSection />
        <PricingSection />
        <Footer />
      </ParticlesBackground>
    </main>
  );
}
