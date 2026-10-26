"use server";

/* eslint-disable no-console */
import { Output, generateText } from "ai";
import { z } from "zod";

import { findMovie } from "@/data/loaders";

const movieDetailsSchema = z.object({
  category: z
    .enum([
      "paranormal",
      "slasher",
      "zombies",
      "vampires",
      "gore",
      "witches",
      "psychological",
      "comedic",
    ])
    .describe("The most relevant category for the movie."),
  director: z.string().describe("The film director"),
  starring: z.string().describe("The top three cast members"),
  synopsis: z.string().describe("A brief synopsis of the plot"),
  title: z.string().describe("The film title"),
  year: z.string().describe("The year it was released"),
});

/** An AI pick, plus its TMDB match when one was found. */
export type MovieRecommendation = z.infer<typeof movieDetailsSchema> & {
  poster_path: string | null;
  tmdb_id: number | null;
};

// Shaped for useActionState: it passes the previous result first, then the form data.
export async function getRecommendations(
  _previous: MovieRecommendation[],
  formData: FormData
): Promise<MovieRecommendation[]> {
  const query = formData.get("query");
  console.log("Asking AI for movie recommendations...", query);

  const { output } = await generateText({
    model: "openai/gpt-5-mini",

    // Output.array() tells the SDK we expect an array of objects matching our schema
    output: Output.array({
      element: movieDetailsSchema,
    }),

    prompt: `${query}\n\n`,
  });

  // Look every pick up on TMDB in parallel for its poster and detail-page id.
  return Promise.all(
    output.map(async (movie) => {
      const match = await findMovie(movie.title, movie.year);
      return {
        ...movie,
        poster_path: match?.poster_path ?? null,
        tmdb_id: match?.id ?? null,
      };
    })
  );
}
