# 実装ガイド: エッジでのVisionモデルのベストプラクティス

このガイドでは、Cloudflare Workers上でLlama 3.2 Visionを動作させるために必要な、具体的なコードパターンについて詳述します。

## 1. 入力フォーマット (極めて重要)

### ❌ やってはいけない (よくある間違い)
メッセージの `content` 配列に生の画像バイト列を直接埋め込むと、クライアントライブラリが完全に処理しない限り、トークン爆発 (Error 5021) やバリデーションエラー (Error 3030) を引き起こすことがよくあります。

```typescript
// エンコーディングに確信がない限り、これは避けてください
const inputs = {
  messages: [
    {
      role: 'user',
      content: [
         { type: 'text', text: 'これを読んで' },
         { type: 'image', image: imageBytes } // 100万トークン以上としてカウントされるリスクあり
      ]
    }
  ]
};
```

### ✅ 推奨パターン
`prompt` と `image` をトップレベルのプロパティとして使用します。Workers AIが画像のエンコーディングを自動的かつ効率的に処理してくれます。

```typescript
const inputs = {
  prompt: 'この漫画の画像からすべての文字を抽出してください。日本語で返してください。',
  image: imageBytes // 数値の配列 または Uint8Array
};
const result = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', inputs);
```

## 2. Honoでのファイルアップロード処理
ユーザーからの画像（例：curlやフロントエンドのフォームから）を受け取るには、`c.req.formData()` を使用します。

```typescript
app.post('/ocr', async (c) => {
  // 1. フォームデータのパース
  const formData = await c.req.formData();
  const imageFile = formData.get('image') as File;

  if (!imageFile) return c.json({ error: '画像がありません' }, 400);

  // 2. ファイルをバイト配列に変換
  const arrayBuffer = await imageFile.arrayBuffer();
  // Workers AIは型付き配列オブジェクトではなく、単純な数値の配列を要求することがあります
  const imageBytes = [...new Uint8Array(arrayBuffer)];

  // 3. 推論実行
  const response = await c.env.AI.run('...', {
    prompt: '...',
    image: imageBytes
  });

  return c.json(response);
});
```

## 3. 設定 (`wrangler.jsonc`)
AIバインディングが有効になっていることを確認してください。

```jsonc
{
  "name": "manga-ocr-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23", // 最近の日付を使用
  "ai": {
    "binding": "AI"
  }
}
```

## 4. cURLによるテスト
ファイルを送信する際は常に `-F` (form-data) を使用してください。

```bash
curl -X POST http://localhost:8787/ocr \
  -F "image=@/path/to/manga_page.jpg"
```
