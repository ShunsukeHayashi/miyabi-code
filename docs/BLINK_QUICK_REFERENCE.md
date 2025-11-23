# iPad Blink → Miyabi tmux Quick Reference

**Last Updated**: 2025-11-17
**Purpose**: iPadのBlinkアプリからMac上のMiyabi tmuxセッションに接続する

---

## 📡 接続情報

### ネットワーク情報
| 項目 | 値 |
|------|-----|
| **Local IP** | `192.168.3.30` |
| **Hostname** | `MacBook-Pro-5.local` |
| **Username** | `shunsuke` |
| **SSH Port** | `22` |
| **Mosh Port** | `60000-61000` (UDP) |

### Blinkホスト設定

#### SSH接続
```
Host Name: miyabi-mac
Host: 192.168.3.30
Port: 22
User: shunsuke
Key: miyabi-ipad (Ed25519鍵)
```

#### Mosh接続（モバイル環境推奨）
```
Host Name: miyabi-mac-mosh
Host: 192.168.3.30
Port: 22
User: shunsuke
Mosh: ON ✅
Key: miyabi-ipad (Ed25519鍵)
```

---

## 🎯 Miyabi tmuxセッションへの接続

### 基本的な接続フロー

1. **Blinkで接続**:
   ```bash
   # SSH
   ssh miyabi-mac

   # または Mosh
   mosh miyabi-mac-mosh
   ```

2. **セッション一覧を確認**:
   ```bash
   miyabi-sessions
   # または
   tmux list-sessions
   ```

3. **セッションにアタッチ**:
   ```bash
   # メインセッション
   miyabi-attach

   # 特定のセッション
   miyabi-attach miyabi-orchestra

   # 標準tmuxコマンド
   tmux attach -t miyabi
   ```

---

## 🎨 利用可能なMiyabiセッション

### メインセッション

#### `miyabi` - メイン開発環境（8 windows）
```bash
miyabi-attach
```
- **Window 0**: メインターミナル
- **Window 1-7**: サブタスク・Agent実行環境

#### `miyabi-orchestra` - マルチエージェント・オーケストレーション
```bash
miyabi-attach miyabi-orchestra
```
- 複数のClaude Code Agentが並列実行
- tmux pane分割による可視化

#### `miyabi-reconstruction` - システム再構築セッション
```bash
miyabi-attach miyabi-reconstruction
```
- 大規模リファクタリング専用環境

---

## 💡 便利なコマンド

### セッション管理
```bash
# セッション一覧
miyabi-sessions

# 新しいセッション作成
tmux new-session -s my-session

# セッションから離脱（バックグラウンド実行継続）
Ctrl+b d

# セッションを終了
exit
# または
Ctrl+d
```

### tmux基本操作（Ctrl+b がPrefix）

| キー | 動作 |
|------|------|
| `Ctrl+b d` | セッションから離脱（detach） |
| `Ctrl+b c` | 新しいウィンドウ作成 |
| `Ctrl+b n` | 次のウィンドウ |
| `Ctrl+b p` | 前のウィンドウ |
| `Ctrl+b 0-9` | ウィンドウ番号で移動 |
| `Ctrl+b %` | 縦分割 |
| `Ctrl+b "` | 横分割 |
| `Ctrl+b o` | ペイン間移動 |
| `Ctrl+b z` | ペインのズーム切り替え |
| `Ctrl+b [` | スクロールモード（qで終了） |

---

## 🔧 トラブルシューティング

### 接続できない場合

1. **同一ネットワーク確認**:
   - iPadとMacが同じWi-Fiに接続されているか確認
   - Mac IP: `192.168.3.30`

2. **SSHサーバー確認**（Mac側）:
   ```bash
   sudo systemsetup -getremotelogin
   # → Remote Login: On
   ```

3. **Moshポート確認**:
   - UDP 60000-61000が開いているか確認
   - ルーターのファイアウォール設定

### セッションが見つからない場合

```bash
# セッション一覧で確認
tmux list-sessions

# セッションが無ければ作成
tmux new-session -s miyabi
```

### 鍵認証エラー

```bash
# Mac側で authorized_keys の確認
cat ~/.ssh/authorized_keys

# パーミッション確認
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 🚀 外出先からの接続（Advanced）

### オプション1: Tailscale VPN

1. MacとiPadにTailscaleをインストール
2. 同じTailscaleネットワークに参加
3. Tailscale IPで接続（100.x.x.x）

### オプション2: ポートフォワーディング

⚠️ **セキュリティリスクあり - SSH鍵認証必須**

1. ルーターでポート22を転送（または別ポート）
2. グローバルIPまたはDDNSで接続
3. Fail2banなどのセキュリティ対策推奨

---

## 📝 参考資料

- **Miyabi CLAUDE.md**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/CLAUDE.md`
- **tmux Operations**: `.claude/TMUX_OPERATIONS.md`
- **Blink Shell Docs**: https://docs.blink.sh/

---

**Quick Connect Commands**:
```bash
# SSH
ssh miyabi-mac && miyabi-attach

# Mosh
mosh miyabi-mac-mosh -- miyabi-attach miyabi-orchestra
```
