"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function ActiveLink({
  href,
  children,
  className = "",
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`chip ${isActive ? "chip-active" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}
