"use client";

import { useActionState } from "react";

import Image from "next/image";
import Link from "next/link";

import { VhsLoader } from "@/components/brand/vhs-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  type MovieRecommendation,
  getRecommendations,
} from "@/lib/actions/recommendations";

const initialResults: MovieRecommendation[] = [];

function RecommendationsForm() {
  const [results, formAction, isPending] = useActionState(
    getRecommendations,
    initialResults
  );

  // TODO: add dropdown to select number of recs
  // TODO: add dropdown to select TV, movies or both
  // TODO: add "Add to Watchlist" button

  return (
    <div className="space-y-10">
      <form className="flex flex-col gap-4" action={formAction}>
        <Label htmlFor="query">Recommend for me...</Label>
        <Input
          id="query"
          name="query"
          placeholder="Describe what you're looking for..."
          required
          type="text"
        />
        <Button variant="outline" type="submit" disabled={isPending}>
          Recommend Something!
        </Button>
      </form>

      {isPending ? (
        <VhsLoader label="Finding recommendations" />
      ) : (
        <ul className="space-y-6">
          {results.map((movie) => (
            <li className="flex gap-4" key={`${movie.title}-${movie.year}`}>
              <div className="bg-muted relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-sm shadow-md sm:w-32">
                {movie.poster_path ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="(max-width: 640px) 96px, 128px"
                    src={`${process.env.NEXT_PUBLIC_API_IMAGE_PATH}w342${movie.poster_path}`}
                  />
                ) : (
                  <div className="border-border flex h-full w-full items-center justify-center border-x-8 px-2 text-center">
                    <span className="font-display text-muted-foreground text-xs font-medium">
                      {movie.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-xl font-semibold">
                  {movie.tmdb_id ? (
                    <Link href={`/movies/${movie.tmdb_id}`}>{movie.title}</Link>
                  ) : (
                    movie.title
                  )}{" "}
                  ({movie.year})
                </h2>
                <p className="text-muted-foreground text-sm">
                  {movie.starring}
                </p>
                <p>{movie.synopsis}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
RecommendationsForm.displayName = "RecommendationsForm";

export { RecommendationsForm };
