"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { SearchIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchProps {
  onSubmit?: () => void;
}

function Search({ onSubmit }: SearchProps = {}) {
  const [term, setTerm] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    router.push(`/search?term=${encodeURIComponent(term)}`);
    setTerm("");
    onSubmit?.();
  };

  const clearSearch = () => {
    setTerm("");
  };

  return (
    <div className="md:w-60% flex w-full p-0 md:p-4">
      {/* action + name keep this a working GET form before React hydrates;
          handleSubmit takes over once it has. */}
      <form id="searchForm" action="/search" onSubmit={handleSubmit}>
        <div className="flex w-full gap-4">
          <Input
            aria-label="Search movies and TV shows"
            placeholder="Search movies and shows"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            id="search"
            name="term"
          />
          {term && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" aria-label="Search movies and TV shows">
            <SearchIcon className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

Search.displayName = "Search";

export { Search };
