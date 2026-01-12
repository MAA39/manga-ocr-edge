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
    const imageFile = formData.get('image') as File

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

export default app
