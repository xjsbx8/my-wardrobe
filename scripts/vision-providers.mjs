export const VISION_PROVIDERS = {
  kimi: { label: "Kimi", baseUrl: "https://api.moonshot.cn/v1", model: "kimi-k3", envKey: "KIMI_API_KEY" },
  qwen: { label: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.8-max", envKey: "DASHSCOPE_API_KEY" },
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-flash", envKey: "DEEPSEEK_API_KEY" },
  ark: { label: "火山方舟", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-evolving", envKey: "ARK_API_KEY" },
  custom: { label: "兼容接口", baseUrl: "", model: "", envKey: "WARDROBE_VISION_API_KEY" },
};

export const VISION_PROMPT = `识别照片中每一件真实可穿戴的衣物或配饰。照片可能只有单品，也可能有人穿着多件衣物。忽略人体、家具和背景。只返回 JSON 对象，不要 Markdown 或解释，格式为 {"items":[{"name":"中文简短名称","part":"upperbody","color":"#RRGGBB","secondaryColor":null,"tags":["中文标签"],"boundingBox":{"x":0,"y":0,"width":1000,"height":1000}}]}。每件单品一个对象，最多 8 件。part 只能是 upperbody、wholebody_up、lowerbody、accessories_up、shoes。boundingBox 使用相对于整张图的 0 到 1000 整数坐标，x/y 为左上角，width/height 为尺寸，尽量只框住该单品；必要时衣物框可以重叠。secondaryColor 只有明显存在第二种颜色时才填写，否则为 null。tags 给出 1 到 4 个有用的中文细节标签。没有衣物时返回 {"items":[]}。`;

export function validateBaseUrl(value) {
  let url;
  try { url = new URL(value); }
  catch { throw Object.assign(new Error("请输入完整的 API 地址，例如 https://example.com/v1。"), { status: 400 }); }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw Object.assign(new Error("接口地址需要使用 HTTPS（本机地址可用 HTTP）。"), { status: 400 });
  }
  if (url.username || url.password || url.search || url.hash) {
    throw Object.assign(new Error("接口地址不能包含账号、查询参数或片段。"), { status: 400 });
  }
  return value.replace(/\/+$/, "");
}

export function parseVisionResponse(result) {
  const content = result?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : Array.isArray(content)
    ? content.filter((part) => part?.type === "text").map((part) => part.text).join("\n") : "";
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last < first) throw Object.assign(new Error("识图接口没有返回衣物 JSON。请确认所选模型支持图片输入。"), { status: 502 });
  let parsed;
  try { parsed = JSON.parse(cleaned.slice(first, last + 1)); }
  catch { throw Object.assign(new Error("识图接口返回的 JSON 无法解析。请更换支持识图的模型。"), { status: 502 }); }
  if (!Array.isArray(parsed.items)) throw Object.assign(new Error("识图接口没有返回 items 列表。"), { status: 502 });
  return parsed.items.slice(0, 8);
}

export async function analyzeClothing({ key, baseUrl, model, image, mime = "image/png", fetcher = fetch }) {
  let response;
  try {
    response = await fetcher(`${validateBaseUrl(baseUrl)}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: [
          { type: "text", text: VISION_PROMPT },
          { type: "image_url", image_url: { url: `data:${mime};base64,${image.toString("base64")}` } },
        ] }],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error(`无法连接识图接口：${error.name === "TimeoutError" ? "请求超时" : error.message}`), { status: 502 });
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.error?.message || `HTTP ${response.status}`;
    throw Object.assign(new Error(`识图请求失败：${message}`), { status: 502 });
  }
  return parseVisionResponse(result);
}
