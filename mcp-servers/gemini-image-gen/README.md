# Gemini Image Generation MCP Server

🎨 MCP Server for AI Image Generation using Google's Gemini and Imagen models.

## Features

- **Gemini 2.5 Flash Image (Nano Banana)** - Fast image generation with text rendering
- **Gemini 3 Pro Preview (Nano Banana Pro)** - High-quality image generation
- **Imagen 3** - Highest quality photorealistic images
- **Image Editing** - Edit existing images using text prompts
- **Infographic Generation** - Generate hand-drawn style infographics

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

```bash
export GEMINI_API_KEY="your-api-key"
export IMAGE_OUTPUT_DIR="/path/to/output"  # Optional, defaults to /tmp/gemini-images
```

## Tools

### `generate_image`

Generate an image using Gemini 2.5 Flash Image or Gemini 3 Pro.

```json
{
  "prompt": "A futuristic city with flying cars",
  "model": "gemini-2.5-flash-image",
  "outputFormat": "png"
}
```

### `generate_image_with_imagen`

Generate high-quality photorealistic images using Imagen 3.

```json
{
  "prompt": "A portrait of a golden retriever wearing a cape",
  "numberOfImages": 1,
  "aspectRatio": "1:1"
}
```

### `edit_image`

Edit an existing image using text prompts.

```json
{
  "imagePath": "/path/to/image.png",
  "prompt": "Change the background to a sunset",
  "model": "gemini-2.5-flash-image"
}
```

### `generate_infographic`

Generate hand-drawn style infographics.

```json
{
  "title": "The Journey of a Startup",
  "content": "From idea to success...",
  "style": "graphic-recording",
  "language": "ja"
}
```

### `list_generated_images`

List all generated images in the output directory.

## Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "gemini-image-gen": {
      "command": "node",
      "args": ["/path/to/gemini-image-gen/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your-api-key",
        "IMAGE_OUTPUT_DIR": "/path/to/output"
      }
    }
  }
}
```

## License

MIT
