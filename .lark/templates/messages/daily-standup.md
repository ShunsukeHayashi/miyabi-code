# 🌅 Miyabi デイリースタンドアップ

**日付**: ${date}
**レポート時刻**: ${timestamp}

---

## ✅ 昨日完了したこと

${yesterday.completed}

---

## 🔄 今日の予定

${today.planned}

---

## 🤖 Agent 状態

- **稼働中**: ${agents.active_count}/${agents.total_count}
- **完了タスク (24h)**: ${agents.completed_24h}
- **進行中タスク**: ${agents.in_progress}

---

## ⚠️ ブロッカー・課題

${blockers}

---

## 📊 統計情報

- **Issue処理数 (24h)**: ${stats.issues_processed}
- **PR マージ数 (24h)**: ${stats.prs_merged}
- **ビルド成功率**: ${stats.build_success_rate}%
- **平均タスク完了時間**: ${stats.avg_completion_time}

---

## 🎯 今日のフォーカス

${today.focus}

---

**Next Update**: ${next_update_time}
