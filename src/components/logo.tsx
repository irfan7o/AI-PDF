"use client";

import Link from "next/link";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Logo() {
  const isMobile = useIsMobile();

  return (
    <Link
      href="/"
      className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group"
    >
      <div className="flex-shrink-0">
        <Image
          src="/logo.svg"
          alt="AIPDF Logo"
          width={40}
          height={40}
          className="h-8 w-8 sm:h-10 sm:w-10 group-hover:scale-105 transition-transform duration-200"
          priority
        />
      </div>
      {/* Single line text for all screen sizes */}
      <span className="font-bold text-lg sm:text-xl text-black">AIPDF</span>
    </Link>
  );
}
