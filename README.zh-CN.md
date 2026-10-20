# 我的衣橱 · Wardrobe

这是 Wardrobe 的本地中文版本。界面使用浅色玻璃质感，可在网页上选择、拖放或粘贴衣物照片；模特参考照也可以在“设置”里上传。原始数据保存在本机 `data/`。

第一次使用请先阅读 [使用前指引](docs/GETTING_STARTED.zh-CN.md)。

## 启动

在解压后的项目目录运行：

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

打开 <http://127.0.0.1:5173/>。项目默认只监听本机地址，使用期间请保持终端运行。

部署到阿里云 Ubuntu 服务器请参阅 [服务器部署说明](DEPLOY.zh-CN.md)。

## 配置识图

点击右上角“设置”，选择 Kimi、通义千问、DeepSeek、火山方舟普通 API，或“其他兼容接口”，填写**支持图片输入**的模型与 API Key。Kimi、千问、DeepSeek 和普通方舟的预设分别是 `kimi-k3`、`qwen3.8-max`、`deepseek-flash`、`doubao-seed-evolving`；其他兼容接口的地址和模型由用户自行填写。预设可按账号与地域修改。密钥只写入本机 `data/settings.json`，不会由配置查询接口回传给网页。

识图接口使用 `chat/completions` 多模态消息格式。每次上传会把所选照片发送到你配置的服务商，请只上传你愿意交给该服务商处理的照片。未接入真实密钥时无法验证服务商账号的实际调用权限。

## 生图与模特参考照

商品抠图和穿搭照是**可选**功能。生图服务可选火山方舟普通 API、火山方舟 Agent Plan，或用户自行填写的其他兼容图片编辑接口。方舟使用 `/images/generations`，其他兼容接口使用 `/images/edits`。Agent Plan 的默认模型为 `doubao-seedream-5-0-pro`，普通方舟的默认模型为 `doubao-seedream-5-0-pro-260628`。两种方舟接口使用不同地址和密钥；方舟生图请求会明确传入 `"watermark": false`。其他兼容生图接口的地址和模型不预填。没有生图密钥时，系统会先识别并裁剪单品，由你审核后把裁剪图收入衣橱。

Agent Plan 控制台把 Seedream 5.0 Pro 列在“视觉模型”下；它支持单图及多图作为参考进行生图，本应用已提供该预设。衣物识别需要模型按照片返回结构化的衣物信息，调用的是文本生成接口；Agent Plan 套餐说明对独立应用直接调用这类接口设有限制，因此识图请使用普通方舟 API 或其他服务商。

**模型名称说明：** Seedream 5.0 Pro 用于图片生成；Seedance 是视频生成系列。本应用的生图预设使用 Seedream。

如需生成穿搭照，在设置中上传一张本人参考照。图片会转成 PNG，存放在本机 `data/model-reference.png`。没有参考照时，仍可生成商品抠图并收入衣橱。

也可以直接在 `.env` 中配置环境变量；网页设置优先于同类环境变量。Agent Plan 使用 `ARK_AGENT_PLAN_API_KEY`、`WARDROBE_IMAGE_PROVIDER=ark-plan`，并可通过 `WARDROBE_IMAGE_MODEL` 修改模型。其他兼容接口使用 `WARDROBE_VISION_API_KEY` 或 `WARDROBE_IMAGE_API_KEY`，以及对应的 `WARDROBE_*_BASE_URL` 和 `WARDROBE_*_MODEL`。

## 接口依据

- [Kimi 官方帮助：API 与视觉模型](https://www.kimi.com/help/kimi-api/api-overview)
- [阿里云百炼：视觉理解模型](https://help.aliyun.com/zh/model-studio/vision-model/)
- [DeepSeek 官方：Vision](https://api-docs.deepseek.com/guides/vision/)
- [火山方舟：模型列表](https://docs.volcengine.com/docs/ark/model-list?lang=zh)
- [火山方舟：接口地址和鉴权](https://docs.volcengine.com/docs/ark/base-url-and-authentication?lang=en)
- [火山方舟：Agent Plan 视觉模型及专属接口](https://docs.volcengine.com/docs/ark/agent-plan-personal-visual-models?lang=zh)
- [火山方舟：Agent Plan 套餐使用范围](https://docs.volcengine.com/docs/ark/agent-plan-personal-plan-overview?lang=zh)
- [火山方舟：图片生成 API](https://docs.volcengine.com/docs/ark/image-generation-api?lang=zh)

服务商的可用模型和限制可能更新，请以各自控制台为准。

## 开源来源与许可

本项目基于 [tandpfun/wardrobe](https://github.com/tandpfun/wardrobe) 的提交 `f44006cce7e4779e595a35b25fbbc8dabc68d7e4` 二次创作。原项目采用 MIT 许可证；本版本保留了原有 [LICENSE](LICENSE) 版权与许可文本。主要改动为中文界面、玻璃质感样式、网页上传照片，以及多服务商识图和生图接入。公开发布时请保留许可文件与来源说明，并不要上传 `.env`、`data/`、个人照片或 API Key。
