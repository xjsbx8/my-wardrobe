import { useEffect, useRef, useState } from "react";
import { Check, GearSix, UploadSimple, X } from "@phosphor-icons/react";
import "./settings-panel.css";

const PRESETS = {
  kimi: { label: "Kimi", baseUrl: "https://api.moonshot.cn/v1", model: "kimi-k3" },
  qwen: { label: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.8-max" },
  deepseek: { label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-flash" },
  ark: { label: "火山方舟", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-evolving" },
  custom: { label: "其他兼容接口", baseUrl: "", model: "" },
};

const IMAGE_PRESETS = {
  "ark-plan": { label: "火山方舟 Agent Plan", baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3", model: "doubao-seedream-5-0-pro" },
  ark: { label: "火山方舟（普通 API）", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seedream-5-0-pro-260628" },
  custom: { label: "其他兼容生图接口", baseUrl: "", model: "" },
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

async function post(path, value) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "保存失败，请重试。");
  return result;
}

export function SettingsPanel({ open, onClose, setup, onSaved }) {
  const photoInput = useRef(null);
  const [vision, setVision] = useState({ provider: "ark", baseUrl: PRESETS.ark.baseUrl, model: PRESETS.ark.model, apiKey: "" });
  const [image, setImage] = useState({ provider: "ark-plan", ...IMAGE_PRESETS["ark-plan"], apiKey: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!setup) return;
    const provider = PRESETS[setup.provider] ? setup.provider : "ark";
    setVision({ provider, baseUrl: setup.visionBaseUrl || PRESETS[provider].baseUrl, model: setup.visionModel || PRESETS[provider].model, apiKey: "" });
    const imageProvider = IMAGE_PRESETS[setup.imageProvider] ? setup.imageProvider : "ark-plan";
    setImage({ provider: imageProvider, baseUrl: setup.imageBaseUrl || IMAGE_PRESETS[imageProvider].baseUrl, model: setup.imageModel || IMAGE_PRESETS[imageProvider].model, apiKey: "" });
  }, [setup]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const changeProvider = (provider) => {
    const preset = PRESETS[provider];
    setVision({ provider, baseUrl: preset.baseUrl, model: preset.model, apiKey: "" });
    setError(""); setSuccess("");
  };

  const changeImageProvider = (provider) => {
    const preset = IMAGE_PRESETS[provider];
    setImage({ provider, baseUrl: preset.baseUrl, model: preset.model, apiKey: "" });
    setError(""); setSuccess("");
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    try {
      const next = await post("/api/import/config", { vision, image });
      onSaved(next);
      setVision((current) => ({ ...current, apiKey: "" }));
      setImage((current) => ({ ...current, apiKey: "" }));
      setSuccess(next.ready ? "设置已保存，可以上传衣物照片。" : "设置已保存。请填写识图 API Key 后再上传照片。");
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const uploadReference = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const imageDataUrl = await fileToDataUrl(file);
      const next = await post("/api/import/model-reference", { imageDataUrl });
      onSaved(next);
      setSuccess("模特参考照已上传。生成穿搭照时会使用它。");
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="settings-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-header">
          <div><span className="settings-eyebrow"><GearSix size={14} /> 服务设置</span><h2 id="settings-title">连接你的识图服务</h2><p>衣物照片从浏览器上传，识图请求由衣橱服务发送。</p></div>
          <button className="settings-close" type="button" onClick={onClose} aria-label="关闭设置"><X size={20} /></button>
        </header>
        <form onSubmit={save}>
          <div className="settings-section-title"><span>01</span><h3>衣物识别</h3><em>必填</em></div>
          <div className="settings-grid">
            <label className="settings-field"><span>服务商</span><select value={vision.provider} onChange={(event) => changeProvider(event.target.value)}>{Object.entries(PRESETS).map(([id, preset]) => <option value={id} key={id}>{preset.label}</option>)}</select></label>
            <label className="settings-field"><span>模型名称</span><input value={vision.model} onChange={(event) => setVision({ ...vision, model: event.target.value })} placeholder="支持图片输入的模型" required /></label>
            <label className="settings-field settings-full"><span>API 地址</span><input value={vision.baseUrl} onChange={(event) => setVision({ ...vision, baseUrl: event.target.value })} placeholder="https://…/v1" required /></label>
            <label className="settings-field settings-full"><span>识图 API Key {setup?.hasApiKey && vision.provider === setup.provider && <small>已保存，留空则保持</small>}</span><input type="password" autoComplete="off" value={vision.apiKey} onChange={(event) => setVision({ ...vision, apiKey: event.target.value })} placeholder={setup?.hasApiKey && vision.provider === setup.provider ? "•••••••• 已保存" : "输入 API Key"} /></label>
          </div>
          <div className="settings-section-title"><span>02</span><h3>商品抠图与穿搭照</h3><em>可选</em></div>
          <p className="settings-help">Agent Plan 的视觉模型包含 Seedream 5.0 Pro，可依据上传照片生成单品图和穿搭照；需使用专属密钥和含 /plan 的地址。这里的“视觉模型”是生图服务，衣物识别仍在上方单独配置。留空也可使用裁剪图入库。</p>
          <div className="settings-grid">
            <label className="settings-field"><span>生图服务</span><select value={image.provider} onChange={(event) => changeImageProvider(event.target.value)}>{Object.entries(IMAGE_PRESETS).map(([id, preset]) => <option value={id} key={id}>{preset.label}</option>)}</select></label>
            <label className="settings-field"><span>生图模型</span><input value={image.model} onChange={(event) => setImage({ ...image, model: event.target.value })} placeholder={image.provider === "custom" ? "自行填写兼容模型 ID" : "生图模型 ID"} required={Boolean(image.apiKey) || (setup?.hasImageApiKey && image.provider === setup.imageProvider)} /></label>
            <label className="settings-field settings-full"><span>生图 API Key {setup?.hasImageApiKey && image.provider === setup.imageProvider && <small>已配置，留空则保持</small>}</span><input type="password" autoComplete="off" value={image.apiKey} onChange={(event) => setImage({ ...image, apiKey: event.target.value })} placeholder={setup?.hasImageApiKey && image.provider === setup.imageProvider ? "•••••••• 已配置" : "可选"} /></label>
            <label className="settings-field settings-full"><span>生图 API 地址</span><input value={image.baseUrl} onChange={(event) => setImage({ ...image, baseUrl: event.target.value })} placeholder="https://…/v1" required={Boolean(image.apiKey) || (setup?.hasImageApiKey && image.provider === setup.imageProvider)} /></label>
          </div>
          <p className="settings-help">{image.provider === "custom" ? "其他兼容生图接口需支持 /images/edits、图片上传与 Base64 图片返回，请自行填写 API 地址、模型和密钥。" : "Seedream 用于图片生成；Seedance 是视频生成模型，此处不能直接用于商品图或穿搭照。"}</p>
          <div className="settings-actions"><button className="settings-save" type="submit" disabled={busy}><Check size={16} /> 保存设置</button></div>
        </form>
        <div className="settings-reference">
          <div><div className="settings-section-title"><span>03</span><h3>模特参考照</h3><em>可选</em></div><p className="settings-help">仅用于生成穿搭照。支持常见图片格式，上传后保存在本机。</p></div>
          <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadReference} />
          <button className="settings-upload" type="button" disabled={busy} onClick={() => photoInput.current?.click()}><UploadSimple size={17} /> {setup?.hasModelReference ? "更换参考照" : "上传参考照"}</button>
        </div>
        <p className="settings-privacy">密钥保存在运行衣橱服务的设备上，不会回显到页面。服务器部署时请配置 HTTPS 和访问密码；所有访问者共用当前衣橱及 API 配置。</p>
        {error && <p className="settings-message is-error" role="alert">{error}</p>}
        {success && <p className="settings-message is-success" role="status">{success}</p>}
      </section>
    </div>
  );
}
