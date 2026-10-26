/* eslint-disable no-console */
import { Output, generateText } from "ai";
import dotenvFlow from "dotenv-flow";
import { z } from "zod";

dotenvFlow.config();

async function main() {
  console.log("Asking AI for movie recommendations...");

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
    starring: z.string().describe("The top three cast members"),
    synopsis: z.string().describe("A brief synopsis of the plot"),
    title: z.string().describe("The film title"),
    year: z.string().describe("The year it was released"),
  });

  // const result = await generateText({
  //   model: "openai/gpt-5-mini",
  //   prompt: `Give me 10 good classic horror movies from the 1970s and 80s for Halloween.`,
  // });

  const { output: classifiedRequests } = await generateText({
    model: "openai/gpt-5-mini",

    // Output.array() tells the SDK we expect an array of objects matching our schema
    output: Output.array({
      element: movieDetailsSchema,
    }),

    // Fast model ideal for classification tasks (low cost, immediate response)
    // For nuanced edge cases, consider 'openai/gpt-5' (reasoning model)
    // Prompt combines instruction + stringified data
    prompt: `Give me 10 good classic horror movies from the 1970s and 80s for Halloween.\n\n`,
  });

  console.log("\n--- AI Response (Structured JSON) ---");
  // Output the validated, structured array
  console.log(JSON.stringify(classifiedRequests, null, 2));
  console.log("-----------------------------------");
}

main().catch(console.error);
