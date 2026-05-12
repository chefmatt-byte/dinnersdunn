const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
    return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Methods": "POST, OPTIONS"
                },
                      body: ""
                        };
}

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (body.type === "scan") {
      const response = await client.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 1024,
                messages: [{
                  role: "user",
                              content: [
                    {
                                  type: "image",
                                                  source: {
                type: "base64",
                                  media_type: body.mediaType || "image/jpeg",
                                  data: body.image
                  }
                  },
{
              type: "text",
                              text: "You are an expert kitchen inventory AI. Analyze this fridge or cabinet photo with extreme thoroughness. Identify and list EVERY single food item you can see, including: all meats and proteins (chicken, beef, fish, eggs, deli meats), all vegetables and fruits (even partial or obscured ones), all dairy products (milk, cheese, butter, yogurt, cream), all condiments and sauces (ketchup, mustard, hot sauce, mayo, soy sauce, salad dressing), all beverages (juice, water, soda, beer, wine), all leftovers or meal prep containers, all herbs and garnishes, all processed or packaged foods you can identify by packaging. Look in every shelf, drawer, and door compartment visible. Do not skip anything even if partially visible or in the background. Return ONLY a valid JSON array of specific ingredient name strings. Be as specific as possible — write 'cheddar cheese' not just 'cheese', 'whole milk' not just 'milk', 'chicken breast' not just 'chicken'. Example format: [\"chicken breast\", \"whole milk\", \"cheddar cheese\", \"eggs\", \"hot sauce\", \"butter\", \"leftover pasta\", \"apple juice\"]. Identify everything — err on the side of including more rather than fewer items."
                }
          ]
      }]
    });

      let text = response.content[0].text.trim();
      text = text.replace(/```json|```/g, "").trim();
      let ingredients = [];
      try { ingredients = JSON.parse(text); } catch(e) { ingredients = []; }

      return {
                statusCode: 200,
                headers: {
                  "Content-Type": "application/json",
                              "Access-Control-Allow-Origin": "*"
                    },
        body: JSON.stringify({ ingredients })
          };
  }

    if (body.type === "chat") {
      const response = await client.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 1024,
                system: body.system,
                messages: body.messages.slice(-10)
        });

      return {
                statusCode: 200,
                headers: {
                  "Content-Type": "application/json",
                              "Access-Control-Allow-Origin": "*"
                    },
        body: JSON.stringify({ reply: response.content[0].text })
          };
  }

    return {
            statusCode: 400,
            body: JSON.stringify({ error: "Unknown request type" })
      };
  } catch (err) {
    console.error("Chef function error:", err);
    return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: "I had trouble reaching the chef. Please try again." })
              };
  }
};
