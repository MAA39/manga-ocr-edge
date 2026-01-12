# Manga OCR API

A Cloudflare Workers + Hono application to extract text from manga images using Llama 3.2 Vision.

## Project Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Login to Cloudflare** (required for AI models):
    ```bash
    npx wrangler login
    ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

## Usage

### 1. Agree to Token Terms (First Run Only)
Some models require a one-time agreement. Visit this endpoint once:
```
http://localhost:8787/agree
```
If you see a "Thank you for agreeing" error message, that means it worked!

### 2. OCR an Image
Send a POST request with a manga image:
```bash
curl -X POST http://localhost:8787/ocr \
  -F "image=@path/to/your/manga.jpg"
```

## Structure
- `src/index.ts`: Main application logic.
- `wrangler.jsonc`: Cloudflare configuration.

## Documentation
- [Architecture Outline](docs/architecture_outline.md): Why we chose this stack.
- [Technical Stack](docs/technical_stack.md): Deep dive into Hono & Cloudflare Workers.
- [Implementation Guide](docs/implementation_guide.md): Correct code patterns (Input formats etc).
- [Troubleshooting Log](docs/troubleshooting_log.md): How we solved errors 3030 & 5021.
