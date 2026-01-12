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
1. **Show, Don't Tell（語るな、見せろ）**:
   - 悪い例：「彼は怒っていた」
   - 良い例：「彼は奥歯をギリリと噛み締め、拳を震わせた」「眉間に深い皺を刻んだ」
   - 感情を直接書かず、キャラクターの**行動**や**身体反応**で表現してください。

2. **漫符（Visual Symbols）の自然な翻訳**:
   - 汗マーク (💦) -> 「冷や汗が背中を伝う」「言葉に詰まり、視線を泳がせる」など、焦りや動揺として描く。
   - 青筋 (💢) -> 「額に青筋を浮かべる」「こめかみがピクリと跳ねる」など、抑えきれない怒りとして描く。
   - 縦線 (|||) -> 「顔から血の気が引く」「目の前が真っ暗になる」など、絶望やショックとして描く。

3. **言語と文体**:
   - **自然な日本語の小説**として書いてください。翻訳調（「〜した顔で」の多用など）は避けてください。
   - 文末を「〜だ」「〜である」調、または「〜した」調で統一し、リズムを整えてください。

この画像を分析し、上記のルールに基づいて、プロの作家として日本語で小説化してください。
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
