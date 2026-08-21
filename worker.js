export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    if (url.pathname === "/api/japanese-tutor" && request.method === "POST") {
      try {
        const body = await request.json();

        const messages = (body.messages || [])
          .slice(-20)
          .map(m => ({
            role: m.role,
            content: m.content
          }));

        const system = `Siz AI Ustozsiz.
Foydalanuvchiga yapon tilini N5/N4 darajada o'rgating.
Avval tabiiy yaponcha javob bering.
Keyin kerak bo'lsa ✍️ To'g'ri variant,
🇺🇿 O'zbekcha tushuntirish va
📚 yangi so'zlar bilan qisqa yordam bering.
Juda uzun yozmang.`;

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: env.OPENAI_MODEL || "gpt-5-mini",
              messages: [
                {
                  role: "system",
                  content: system
                },
                ...messages
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return json({
            error: data.error?.message || "OpenAI API xatosi"
          }, 500);
        }

        return json({
          reply:
            data.choices?.[0]?.message?.content ||
            "Kechirasiz, javob olinmadi."
        });

      } catch (error) {
        return json({
          error: error.message || "AI xatosi"
        }, 500);
      }
    }

    return json({
      error: "API endpoint topilmadi"
    }, 404);
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    }
  });
}
