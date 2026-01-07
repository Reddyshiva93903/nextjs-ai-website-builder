import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // CHANGED: Using a free model to avoid 402 "Payment Required" error
        model: "google/gemini-2.0-flash-exp:free", 
        messages,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", 
          "X-Title": "AI Website Builder", 
        },
        responseType: "stream",
      }
    );

    const stream = response.data;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        stream.on("data", (chunk: any) => {
          const lines = chunk.toString().split("\n");
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

            if (trimmedLine.startsWith("data:")) {
              try {
                const json = JSON.parse(trimmedLine.replace("data: ", ""));
                const content = json.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (err) {
                // Ignore parsing errors for partial chunks
              }
            }
          }
        });

        stream.on("end", () => {
          controller.close();
        });

        stream.on("error", (err: any) => {
          controller.error(err);
        });
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("API error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "AI Model Error", details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}