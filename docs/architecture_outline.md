# Project Outline: Manga OCR on the Edge

このドキュメントでは、なぜ「Cloudflare Workers + Hono + Llama 3.2 Vision」という構成が、漫画OCRアプリにとって最適解（"爆速"かつ"低コスト"）なのかを解説します。

## 1. アーキテクチャ概要

```mermaid
graph LR
    User[User (Browser/App)] -->|Image Upload| Edge[Cloudflare Workers (Edge)]
    Edge -->|Direct Inferece| AI[Workers AI (Llama 3.2 Vision)]
    AI -->|Text Data| Edge
    Edge -->|JSON Response| User
```

## 2. なぜこの技術スタックなのか？ (Why it works)

### 🚀 1. 物理的な距離の短縮 (Latency)
通常、OCR処理には重たいGPUサーバーが必要です。これをAWSの特定リージョン（例：バージニア北部）に置くと、日本からのアクセスには往復の通信遅延が発生します。
**Cloudflare Workers** は世界中のエッジロケーション（日本だけで数十箇所）で動きます。ユーザーの物理的に一番近い場所でリクエストを受け取り、処理を開始できます。

### ⚡ 2. コールドスタート対策 (Speed)
Lambda等のサーバーレス関数の弱点は、起動の遅さ（コールドスタート）です。Electronアプリ等に重いAIモデルをバンドルすると、起動時間とアプリサイズが肥大化します。
**Workers** はV8アイソレート技術により、ミリ秒単位で起動します。
**Workers AI** はCloudflare側で既にロードされたモデルを共有利用するため、モデルのロード時間をユーザーが待つ必要が極めて少なくなります。

### 💰 3. コスト効率 (Cost)
自前でGPUインスタンス（AWS g4dn.xlarge等）を借りると、待機時間中も課金され、月額数百ドルかかります。
**Workers AI** は「使った分だけ」の従量課金です。実験段階や個人利用では無料枠（1日1万ニューロン）で十分賄えることが多く、スケーリングしても破格の安さです。

### 🛠 4. 開発体験 (DX) - Hono
**Hono** はWeb標準に準拠した超軽量フレームワークです。
- **ポータビリティ**: 将来的にNode.jsやBun、Deno、AWS Lambdaに移行したくなっても、コードをほぼ書き換えずに移動できます。
- **型安全性**: TypeScriptとの相性が抜群で、`Bindings` の定義などを通じて堅牢な開発が可能です。

## 3. この構成のメリットまとめ

| 項目 | 従来のアプローチ (Python/FastAPI on EC2) | 今回のアプローチ (Hono on Workers AI) |
|Data to AI Speed| 遅い (画像アップロード + 推論) | **速い (エッジ間転送のみ)** |
|Cost| 高い (常時稼働GPU) | **安い (リクエスト単位)** |
|Maintenance| 大変 (サーバー管理、OS更新) | **楽 (完全マネージド)** |
|Scalability| 難しい (オートスケール設定) | **自動 (Cloudflare任せ)** |

## 4. 今後の展望

この「エッジでOCR」が確立できれば、次のステップとして以下が可能になります。
- **翻訳パイプラインの結合**: OCR結果をそのまま `Llama 3` 等のテキストモデルに流して翻訳し、一気に返す。
- **ストリーミング**: 認識できた文字から順次クライアントに返す。
- **キャッシュ**: 同じ画像に対するOCR結果をエッジキャッシュ(KV)に保存し、2回目は爆速で返す。
