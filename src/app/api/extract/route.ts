import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

// Function to call OpenRouter API
async function callOpenRouter(prompt: string, imageBase64?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const messages: {role: string, content: string | Array<{type: string, text?: string, image_url?: {url: string}}>}[] = [];

  if (imageBase64) {
      messages.push({
          role: "user",
          content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
      });
  } else {
      messages.push({ role: "user", content: prompt });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "PortfolioTracker",
    },
    body: JSON.stringify({
      model: "google/gemini-pro-vision", // Using a vision model as an example.
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenRouter API Error:", err);
    throw new Error("Failed to get response from AI");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in DB to relate items to
    let dbUser = await prisma.user.findFirst({
        where: { username: session.user.name || "default" }
    });

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                username: session.user.name || "default",
                password: "hashed_password" // dummy password for credential provider
            }
        });
    }

    const userId = dbUser.id;


    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || !title) {
      return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";
    let extractedDataRaw = "";

    const prompt = "Extract portfolio data from this document/image. Return ONLY a JSON object with a summary, total_value (if available), and an array of assets (with name, value, quantity if available). Do not include any markdown formatting like ```json.";

    if (file.type === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
      // Send text to OpenRouter
      extractedDataRaw = await callOpenRouter(prompt + "\\n\\nDocument text:\\n" + extractedText.substring(0, 4000)); // Limit text length
    } else if (file.type.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      extractedDataRaw = await callOpenRouter(prompt, base64);
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Save to DB
    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        userId,
        title,
        extractedData: extractedDataRaw,
      },
    });

    return NextResponse.json({ success: true, item: portfolioItem });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
