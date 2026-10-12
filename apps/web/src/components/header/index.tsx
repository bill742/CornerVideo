"use client";

import { useState } from "react";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { HeaderContent } from "./header-content";
import { Logo } from "./logo";

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div aria-hidden className="awning h-2 w-full" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop: Right side actions */}
        <div className="hidden items-center gap-2 md:flex">
          <HeaderContent />
        </div>

        {/* Mobile: Hamburger menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full">
            <SheetHeader>
              <SheetTitle className="pt-4">
                <Logo />
              </SheetTitle>
              <SheetDescription className="text-start">
                Search movies and shows, or manage your membership
              </SheetDescription>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-6">
              <HeaderContent onSearchSubmit={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

Header.displayName = "Header";

export { Header };
