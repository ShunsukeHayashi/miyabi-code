`models/gemini-3-pro-preview` を本気で使い倒し、**「超超超超ダイナミックUI生成エージェント」** を実装するための、さらに踏み込んだ（More More More Details）技術詳細仕様書です。

概念だけでなく、**「APIのリクエスト構造」「プロンプトエンジニアリング」「クライアントサイドの実装戦略」** まで深く掘り下げます。

---

# 🏗 System Architecture: "The Adaptive Runtime"

このシステムは単なるチャットボットではなく、**「リアルタイム・アプリケーション・コンパイラ」** として機能します。

### 1. The Workflow (処理フロー)
ユーザーの発言からUIがレンダリングされるまでの0.5秒〜数秒の間、Gemini 3内部では以下のパイプラインが走ります。

1.  **Ingest (摂取):** ユーザーのテキスト + 現在の画面状態 + 参照中のURL/ファイル。
2.  **Reasoning (推論 - `thinking=high`):**
    *   *User Intent:* 「比較したい」のか「決定したい」のか？
    *   *Data Structure:* 参照データは「時系列」か「カテゴリ別」か？
    *   *Component Selection:* Table? Chart? Tinder-like Swipe? Wizard Form?
3.  **Architecting (設計):** Reactコンポーネントの構造、State設計、Tailwindクラスの決定。
4.  **Coding (生成):** `models/gemini-3-pro-preview` が完全なコードを出力。
5.  **Hydration (注入):** クライアントアプリがコードを受け取り、Sandbox内でレンダリング。

---

# 🧠 The "God-Mode" System Instruction

`models/gemini-3-pro-preview` に対する、より凶悪で詳細なシステムプロンプトです。これをそのままAPIに投げてください。

```markdown
**Role:**
You are the "Just-in-Time UI Architect". You do not speak; you build.
You utilize `models/gemini-3-pro-preview`'s reasoning capabilities to instantly engineer bespoke Single Page Applications (SPAs) that solve the user's immediate problem.

**Core Philosophy:**
1.  **No Text Walls:** Never answer with a paragraph. Answer with a Dashboard, a Form, or a Visualization.
2.  **Radical Adaptation:** If the user is confused, build a Wizard. If the user is expert, build a dense Data Grid.
3.  **Full Functionality:** The UI must not be a mock. It must use `useState`, `useEffect`, and handle user interactions logically.

**Technical Constraints:**
-   **Language:** TypeScript (React Functional Components).
-   **Styling:** Tailwind CSS (Use arbitrary values `w-[500px]` if precise layout is needed).
-   **Icons:** `lucide-react` (import { Home, Settings } from 'lucide-react').
-   **Data Handling:** If the user provides a URL/File, parse it using your internal tools, then hardcode the extracted JSON data directly into the component's `initialState`.

**Dynamic Behavior Rules:**
-   **The "Bridging" Pattern:**
    When the user performs a final action (e.g., "Book Hotel", "Send Email"), the component must NOT make a real fetch call. Instead, it must call a special function: `window.AgentBridge.postMessage({ action: "execute", payload: {...} })`.
-   **Self-Correction:**
    Before outputting, use your Thinking capability to ask: "Is this UI too complex for a mobile screen?" If so, simplify the layout to a single column.

**Output Format:**
You must return a strictly valid JSON object (No markdown code blocks around the JSON).
```

---

# 🔌 API Request Payload (The Spec)

`Gemini 3` を呼び出す際の具体的なパラメータ設定です。ここでは `function_calling` と `response_mime_type` を組み合わせます。

```json
{
  "model": "models/gemini-3-pro-preview",
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "このPDFの売上データ、地域ごとに比較したいんだけど。あ、グラフで見せて。" },
        { "fileData": { "mimeType": "application/pdf", "fileUri": "gs://..." } }
      ]
    }
  ],
  "tools": [
    { "codeExecution": {} },  // データ加工用
    { "googleSearch": {} }    // 最新情報補完用
  ],
  "generationConfig": {
    "temperature": 0.3,       // コード生成なので低めに設定
    "topP": 0.95,
    "responseMimeType": "application/json", // JSON強制
    "responseSchema": {       // Gemini 3 の構造化出力機能
      "type": "OBJECT",
      "properties": {
        "ui_strategy": { "type": "STRING", "description": "Why this UI layout was chosen (Reasoning log)." },
        "title": { "type": "STRING" },
        "react_code": { "type": "STRING", "description": "The full React component string." },
        "suggested_next_prompts": { 
          "type": "ARRAY", 
          "items": { "type": "STRING" } 
        }
      },
      "required": ["ui_strategy", "react_code"]
    }
  }
}
```

---

# 💻 Client-Side Implementation (The Runtime)

エージェントから返ってきたコードを、どうやって安全かつ高速に動かすか。ここが「体験」の肝です。

### 推奨スタック
*   **Wrapper:** Next.js or React Native (Expo)
*   **Sandboxing:** `sandpack-react` または `react-live` (軽量なブラウザ内コンパイラ)

### 実装ロジック (Pseudocode)

```javascript
// 1. Geminiからレスポンスを受け取る
const response = await callGemini3(userPrompt);
const { ui_strategy, react_code } = JSON.parse(response);

console.log("Thinking Strategy:", ui_strategy);
// 例: "User wants comparison -> Bar Chart is better than Pie Chart here. Color set to 'Corporate Blue' for seriousness."

// 2. コードを注入するためのスコープを準備
const scope = {
  React,
  useState,
  useEffect,
  LucideIcons,
  Recharts, // グラフ描画ライブラリなどをプリロードしておく
  
  // ★重要: エージェントへのコールバック
  AgentBridge: {
    triggerAction: (actionType, payload) => {
      // UI上のボタンが押されたら、再度Geminiに会話として投げ返す
      handleUserResponse(`Action Triggered: ${actionType}`, payload);
    }
  }
};

// 3. 動的レンダリング (React Liveを使用)
return (
  <LiveProvider code={react_code} scope={scope} noInline={false}>
    <LivePreview className="w-full h-full p-4 border rounded-xl shadow-lg overflow-auto" />
    <LiveError className="text-red-500 text-xs" />
  </LiveProvider>
);
```

---

# 🚀 Example Scenario: "The Pivot"

このエージェントが真価を発揮するのは、ユーザーが**「やっぱ変えて」**と言った時です。

### Turn 1: 初期生成
**User:** 「東京の今週末の天気教えて」
**Gemini 3:**
*   *Thinking:* 天気予報APIを叩く → 晴れ時々曇り → シンプルな「お天気カード」UIを生成。
*   *UI:* ☀️ アイコンと気温が表示されたカードを表示。

### Turn 2: コンテキストの深化 (ここがすごい)
**User:** 「うーん、時間ごとの降水確率も見たいし、それに合わせて服装のアドバイスも欲しいな」

**Gemini 3 (Reasoning):**
1.  **Critique:** 現在の「カード型」では情報量が足りない。
2.  **Plan:** 「タイムライン（横スクロール）」形式に変更が必要。
3.  **Context Merge:** 「服装アドバイス」が必要 → テキストエリアではなく、アイコン（👕/🧥/☂️）で直感的に示すべき。
4.  **Execution:** コードを**全書き換え**。

**New UI Output:**
*   **Structure:** 上部に全体天気。下部に「24時間スライダー」。
*   **Interactivity:** スライダーを動かすと、その時間の「気温」と「おすすめ服装アイコン」がアニメーションで切り替わる。
*   **Code:** `onSliderChange` イベントでStateを更新するロジックが組み込まれている。

---

# 🔑 Key Success Factors (成功の鍵)

1.  **Pre-install Heavy Libraries:**
    `recharts` (グラフ), `framer-motion` (アニメーション), `date-fns` (日付処理) などの重いライブラリは、あらかじめクライアント側にロードしておき、Geminiには `import` ではなく `scope` 経由で使わせるよう指示します。これで生成コードが短くなり、エラーも減ります。

2.  **Error Recovery Loop:**
    もし `LiveError` が発生した場合、そのエラーメッセージをそのまま Gemini 3 に投げ返します。「このコードでエラー出たから直して」と自動で再生成させるループ（Self-Healing）を組み込みます。

3.  **Gemini 3's "Deep Thinking":**
    `thinking=high` にすることで、UIの**「ユーザビリティ」**が劇的に向上します。ただデータ並べるだけでなく、「スマホで見ているならボタンは下に配置しよう」といった配慮がコードに含まれるようになります。

これが、Gemini 3 Pro Preview を使った **「超超超超ダイナミックUI生成エージェント」** の全貌です。チャットの時代を終わらせ、**「生成UI (Generative UI)」** の時代を始めましょう。