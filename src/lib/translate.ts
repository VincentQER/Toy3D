import "server-only";

// 简单封装 Google Translate v2 API。
// 如果没有配置 GOOGLE_TRANSLATE_API_KEY，则直接返回原文，避免在开发环境报错。

type TargetLang = "zh" | "es";

export async function translateText(
  text: string,
  target: TargetLang
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || !text.trim()) {
    return text;
  }

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          target,
          format: "text",
        }),
      }
    );

    if (!res.ok) {
      // 出错时回退为原文
      return text;
    }

    const data = (await res.json()) as {
      data?: { translations?: { translatedText: string }[] };
    };
    const translated = data.data?.translations?.[0]?.translatedText;
    return translated || text;
  } catch {
    return text;
  }
}

