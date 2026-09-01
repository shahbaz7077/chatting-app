// app/api/gemini/route.js

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // this fires if .env.local isn't loaded / key is missing
      return Response.json(
        { error: "GEMINI_API_KEY is missing on the server. Check .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const contents = [
      ...(history || []).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      // CHANGED: now returns the real error text instead of a generic message,
      // so it shows up directly in the browser instead of only in the terminal
      return Response.json(
        { error: `Gemini API error (${response.status}): ${errText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return Response.json({ reply });
  } catch (err) {
    console.error("Gemini route error:", err);
    // CHANGED: return the real error message here too
    return Response.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}