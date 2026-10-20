import { validateBaseUrl } from "./vision-providers.mjs";

export const IMAGE_PROVIDERS = {
  custom: { label: "其他兼容生图接口", baseUrl: "", model: "", envKey: "WARDROBE_IMAGE_API_KEY" },
  ark: { label: "火山方舟（普通 API）", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seedream-5-0-pro-260628", envKey: "ARK_API_KEY" },
  "ark-plan": { label: "火山方舟 Agent Plan", baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3", model: "doubao-seedream-5-0-pro", envKey: "ARK_AGENT_PLAN_API_KEY" },
};

export async function generateImage({ provider, key, baseUrl, model, prompt, images, size, quality = "high", fetcher = fetch }) {
  const endpoint = validateBaseUrl(baseUrl);
  let response;
  if (provider === "custom") {
    const form = new FormData();
    form.set("model", model);
    form.set("prompt", prompt);
    form.set("size", size);
    form.set("quality", quality);
    form.set("output_format", "png");
    for (const [index, image] of images.entries()) {
      form.append("image[]", new Blob([image.data], { type: "image/png" }), image.name?.replace(/\.[^.]+$/, ".png") || `image-${index + 1}.png`);
    }
    response = await fetcher(`${endpoint}/images/edits`, {
      method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(240_000),
    });
  } else if (provider === "ark" || provider === "ark-plan") {
    response = await fetcher(`${endpoint}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model, prompt,
        image: images.length === 1
          ? `data:image/png;base64,${images[0].data.toString("base64")}`
          : images.map((image) => `data:image/png;base64,${image.data.toString("base64")}`),
        size: size === "1024x1024" ? "1.5K" : "2K",
        output_format: "png",
        response_format: "b64_json",
        watermark: false,
      }),
      signal: AbortSignal.timeout(240_000),
    });
  } else {
    throw new Error("请选择有效的生图服务。");
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || `生图请求失败（HTTP ${response.status}）。`);
  const encoded = result.data?.[0]?.b64_json;
  if (!encoded || typeof encoded !== "string") throw new Error("生图接口未返回图片数据。请确认所选模型支持图生图与 Base64 输出。");
  return Buffer.from(encoded, "base64");
}
