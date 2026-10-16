/* eslint-disable no-console */
import { generateText } from "ai";
import dotenvFlow from "dotenv-flow";

dotenvFlow.config();

async function recommendations() {
  const result = await generateText({
    model: "openai/gpt-5-mini",
    prompt: `What are some good horror movies for Halloween?`,
  });

  console.log("\n--- AI Response ---");
  console.log(result.text);
  console.log("-------------------");
}

recommendations().catch((error) => {
  console.error("❌ Extraction failed:", error.message);
  console.log("\n💡 Common issues:");
  console.log("  - Check your .env file has valid API keys");
  console.log("  - Ensure you have internet connectivity for API calls");
  process.exit(1);
});
