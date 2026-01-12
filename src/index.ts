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

// Reverse Adaptation endpoint (Manga -> Original Novel)
app.post('/original-novel', async (c) => {
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
あなたは、この漫画の原作となった小説の著者です。
目の前にある「漫画のワンシーン」は、あなたがかつて書いた小説の文章を元に、漫画家によって描かれたものです。
その「元となった小説のオリジナルの文章」を、ここでもう一度書き起こしてください。

# 執筆ガイドライン
1. **原作者としての振る舞い**: 画像を「説明」しないでください。あなたの頭の中にある物語を「語って」ください。
2. **媒体への言及禁止**: 「コマ」「吹き出し」「絵」「背景」といった、漫画媒体に関する単語は一切使わないでください。あくまで「純粋な物語」として書いてください。
3. **情報の解凍**: 漫画では絵で一瞬で表現されている「表情」「背景」「スピード感」を、すべて**文学的な文章**（比喩、心理描写、五感）に変換（解凍）してください。
4. **五感の補完**: 絵には描けない「匂い」「気温」「肌触り」「音」を想像し、文章に加えてください。

# 出力形式
タイトルと、本文のみを出力してください。

さあ、あなたの物語を書き始めてください。
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
