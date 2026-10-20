<div align="center">

# Wardrobe

[中文首页](README.md) · [First-use guide (Chinese)](docs/GETTING_STARTED.zh-CN.md)

Your clothes, extracted and organized with your chosen vision and image APIs.

[![License: MIT](https://img.shields.io/badge/license-MIT-191919?style=flat-square)](LICENSE)
[![Node 22+](https://img.shields.io/badge/node-22%2B-191919?style=flat-square)](package.json)

[See the original post →](https://x.com/cdngdev/status/2076812846793650485)

</div>

The following screenshots are from the upstream project; the Chinese interface has been redesigned.

![Upstream Wardrobe gallery](docs/screenshots/gallery.png)

![Modeled wardrobe editor](docs/screenshots/editor.png)

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Run these commands from the extracted source directory. On Windows, copy `.env.example` to `.env` with `Copy-Item .env.example .env`.

The importer needs a vision-capable API key. You can configure Kimi, Qwen, DeepSeek, Ark, or another compatible endpoint in the app's Settings panel. For image generation, choose Ark, Ark Agent Plan with Seedream 5.0 Pro, or another compatible image-editing endpoint. Ark image requests explicitly set `watermark: false`. An image key and model reference photo are optional; without them, reviewed crops can still be added to the wardrobe. See the [Chinese setup guide](README.zh-CN.md) for details.

Open [localhost:5173](http://localhost:5173).

For an Ubuntu server, see the [Chinese deployment guide](DEPLOY.zh-CN.md). The production entry point is `npm run build` followed by `npm run start` behind an HTTPS reverse proxy.

## Import with Codex

This repo includes two Codex skills: one imports clothes and generates modeled item photos; the other styles complete outfits and generates a modeled lookbook.

```text
$import-clothes Import the clothes from ~/Pictures/outfits, create modeled photos, and add them to this wardrobe.
$generate-outfits Create modeled outfit ideas from my wardrobe.
```

Open the cloned repo in Codex and run either prompt. The import skill asks for a local model-reference PNG when needed, reviews every cutout and modeled photo, then writes to `data/library.json` and `data/imported/`. The outfit skill asks how many looks to create, then curates, generates, verifies, and saves the complete collection under `data/`.

### For agents

If you are setting up Wardrobe for a user, ask how they want to import their clothes:

- **Codex:** Ask for a folder or camera-roll location and a model-reference PNG, then extract, model, and import the individual pieces by following [the bundled import skill](.agents/skills/import-clothes/SKILL.md). Afterward, offer to create a requested number of modeled looks with [the outfit-generation skill](.agents/skills/generate-outfits/SKILL.md).
- **Web UI:** Configure a vision provider in Settings, optionally add an image generation provider and upload a model reference photo, then import through the app.

## What it does

- Detects garments in uploaded photos through a configured vision API
- Generates product cutouts through a configured image-editing endpoint or Ark Seedream image generation
- Generates an optional modeled editorial preview
- Keeps originals, jobs, generated images, and the JSON database local in `data/`
- Supports drag, drop, paste, editing, review, regeneration, and approval

## Configuration

| Variable | Default |
| --- | --- |
| `WARDROBE_VISION_PROVIDER` | `ark`; Kimi, Qwen, DeepSeek, and custom are supported |
| `WARDROBE_VISION_API_KEY` | Optional key for a custom vision endpoint |
| `WARDROBE_VISION_BASE_URL` / `WARDROBE_VISION_MODEL` | Optional custom vision address and model |
| `WARDROBE_IMAGE_PROVIDER` | `ark-plan`; `ark` and `custom` are also supported |
| `ARK_AGENT_PLAN_API_KEY` | Optional dedicated Agent Plan key for image generation |
| `WARDROBE_IMAGE_API_KEY` | Optional key for a custom image-editing endpoint |
| `WARDROBE_IMAGE_BASE_URL` | Optional image API address; custom providers use `/images/edits` |
| `WARDROBE_IMAGE_MODEL` | Optional image model override, such as `doubao-seedream-5-0-pro` |
| `WARDROBE_IMAGE_QUALITY` | `high` for custom image-editing endpoints |
| `WARDROBE_MODEL_REFERENCE` | `data/model-reference.png` |
| `WARDROBE_DATA_DIR` | `data` |

## License

This is a Chinese localization and UI/API extension of [tandpfun/wardrobe](https://github.com/tandpfun/wardrobe), based on upstream commit `f44006cce7e4779e595a35b25fbbc8dabc68d7e4`. The original copyright and MIT license text are preserved in [LICENSE](LICENSE). Modifications include Chinese copy, a glass-style interface, browser photo upload, and additional vision/image providers. Please keep the license and attribution when redistributing this version.
