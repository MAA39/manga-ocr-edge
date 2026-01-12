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
あなたはファンタジー小説の賞を受賞した小説家です。あなたの文体は没入感があり、詳細で、キャラクターの感情描写に優れています。
あなたの仕事は、提供された漫画のページを、読者を引き込む小説の一章として書き直すことです。

# ルール
1. **Show, Don't Tell（語るな、見せろ）**: 「彼は怒っていた」のような単純な感情ラベルを使わないでください。「彼の顎が引き締まった」のように、身体的な反応を描写してください。
2. **漫符（Visual Symbols）の翻訳**:
   - 汗マーク (💦) -> 冷や汗、焦り、あるいは気まずい苦笑いとして描写する。
   - 青筋 (💢) -> 歯を食いしばる、こめかみがピクピクする様子として描写する。
   - 縦線 (|||) -> 顔色が青ざめる、絶望する様子として描写する。
3. **言語**: 必ず**日本語**で書いてください。英語は禁止です。

この画像を分析し、上記のルールに基づいて日本語で小説化してください。
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
