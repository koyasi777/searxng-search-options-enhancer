# SearXNG検索オプション強化UI 🔍

## 📌 概要

**SearXNG検索エンジンに、「詳細検索オプションサイドバー」** を追加します。  
検索フォームを拡張し、**ファイル形式・地域・ライセンス・更新日・検索対象範囲などを直感的に設定可能！**  
さらに、**言語選択のドロップダウンを日本語・英語・自動検出のみ**に制限して、スッキリ快適なUIを実現します。

---

## 🧩 主な機能

- 🧠 SearXNGに 「詳細検索オプション」のサイドバーを追加
- 🌐 言語選択ドロップダウンを日本語・英語・自動検出のみに自動フィルタ
- 📁 ファイル形式（PDF/DOC/TXTなど）やサイト指定、ライセンス、更新日の指定も対応
- 🌓 ダークモード対応（OSのテーマに連動）
- 🧲 入力欄と検索ボックスの内容をリアルタイムで相互同期
- 💾 開閉状態をローカルストレージに保存し、好みに応じて展開/折りたたみをキープ

---

## 🖼 対応サイト

多数のSearXNGインスタンスに対応するため、`@match` を以下のように広く指定しています：

```js
// @match        *://*/searx/search*
// @match        *://*/searxng/search*
// @match        *://searx.*/*
// @match        *://*.searx.*/*
```

⚠️ **ご自身の利用しているSearXNGのドメインによっては、このマッチ条件に含まれない場合があります。**  
その場合は `.user.js` ファイル内の `@match` 行を手動で修正し、ご自身の環境に合わせてください。

---

## ⚙️ インストール方法

1. ブラウザに **[Violentmonkey](https://violentmonkey.github.io/)** または **[Tampermonkey](https://www.tampermonkey.net/)** を導入
2. 以下のリンクからスクリプトをインストール  
   👉 **[このスクリプトをインストールする](https://raw.githubusercontent.com/koyasi777/searxng-search-options-enhancer/main/searxng-search-options-enhancer.user.js)**
3. 検索ページにアクセスすると、右上に詳細検索UIが自動表示されます！

---

## 📸 スクリーンショット

※準備中

---

## 🛠 技術構成

- `GM_addStyle` による動的CSS適用
- HTML上の既存検索ボックスと同期するJavaScript処理
- `localStorage` でUIの状態（開閉）を保持
- 言語選択UIは `#language` セレクタをもとに自動フィルタ処理

---

## 🧩 よくある質問

### Q. 英語や日本語以外の言語を使いたい場合は？
A. フィルタ処理を無効にするには、スクリプト内の `filterLanguageDropdown()` 関数をコメントアウトまたは修正してください。

### Q. サイドバーが表示されません
A. お使いのSearXインスタンスのURLが `@match` に含まれているかご確認ください。必要に応じてスクリプトの `@match` を編集して調整できます。

---

## 📜 ライセンス

MIT License  
ご自由に利用・改変いただけますが、**ご利用は自己責任でお願いいたします。**

---

> あなたのSearXNG、もっと直感的に。  
> 「詳細検索」の力を、すべてのSearXユーザーに。
