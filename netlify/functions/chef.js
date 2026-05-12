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
                              text: "You are Chef Matt analyzing a fridge or cabinet photo. Identify every food ingredient, item, condiment, vegetable, fruit, meat, dairy, sauce, and spice you can see. Return ONLY a valid JSON array of ingredient name strings, nothing else, no explanation, no markdown. Example: [\"chicken breast\", \"eggs\", \"broccoli\", \"cheddar cheese\"]. Be thorough — identify everything visible even if partially shown."
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
