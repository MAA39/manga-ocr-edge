import { Hono } from 'hono'

// Cloudflare Workers definition for Bindings
type Bindings = {
  AI: Ai
}

const app = new Hono<{ Bindings: Bindings }>()

// Root endpoint: simple test
app.get('/', async (c) => {
  return c.json({ message: 'Manga OCR API is running! Use POST /ocr to extract text from images.' })
})

// Agree to terms (required for some models initially)
app.get('/agree', async (c) => {
  try {
    const result = await c.env.AI.run(
      '@cf/meta/llama-3.2-11b-vision-instruct',
      { prompt: 'agree' }
    )
    return c.json({ status: 'agreed', result })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// OCR endpoint
app.post('/ocr', async (c) => {
  try {
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as unknown as File

    if (!imageFile) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    // Convert image to byte array
    const imageBytes = [...new Uint8Array(await imageFile.arrayBuffer())]

    const result = await c.env.AI.run(
      '@cf/meta/llama-3.2-11b-vision-instruct',
      {
        prompt: 'Extract all text from this manga image. Return the text in Japanese.',
        image: imageBytes
      }
    )

    return c.json(result)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// Novelization endpoint
app.post('/novel', async (c) => {
  try {
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as unknown as File

    if (!imageFile) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    const imageBytes = [...new Uint8Array(await imageFile.arrayBuffer())]

    const result = await c.env.AI.run(
      '@cf/meta/llama-3.2-11b-vision-instruct',
      {
        prompt: `
You are an award-winning novelist specializing in high-fantasy. Your writing style is immersive, detailed, and character-driven.
Your task is to adapt the provided visual sequence from a manga into a compelling novel chapter.

# Rules
1. **Show, Don't Tell**: Do not use simple emotional labels (e.g., "He was angry"). Describe physical reactions (e.g., "His jaw tightened").
2. **Translate Visual Symbols**:
   - Sweat drop (💦) -> Describe as cold sweat, nervousness, or awkward laughter.
   - Vein pop (💢) -> Describe as gritting teeth or pulsing temples.
   - Vertical lines (|||) -> Describe as pale face or despair.
3. **Language**: Output the story in **Japanese**.

Analyze the image and write the novelization in Japanese based on these rules.
`,
        image: imageBytes
      }
    )

    return c.json(result)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

export default app
