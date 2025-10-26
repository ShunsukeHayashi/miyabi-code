# Mac mini LLM Server - セットアップチェックリスト

Mac mini側で確認・実行すべき項目の完全リスト

---

## 📋 事前確認 (5分)

### 1. システム情報確認

```bash
# macOS バージョン
sw_vers

# 期待される出力:
# ProductName:        macOS
# ProductVersion:     14.x.x (または 13.x.x, 12.x.x)
# BuildVersion:       23Xxxx

# Mac mini モデル確認
system_profiler SPHardwareDataType | grep "Model\|Chip\|Memory"

# 期待される出力:
# Model Name: Mac mini
# Chip: Apple M1 / M2 / M3
# Memory: 16 GB / 32 GB
```

**✅ チェックポイント**:
- [ ] macOS 12 Monterey 以降
- [ ] Apple Silicon (M1/M2/M3)
- [ ] RAM 16GB 以上

---

### 2. ディスクスペース確認

```bash
# 空きディスク容量確認
df -h /

# 期待される出力:
# Filesystem     Size   Used  Avail Capacity  Mounted on
# /dev/disk3s1  500Gi  400Gi  50Gi    89%    /
#                              ^^^ 50GB以上必要

# ホームディレクトリの容量
du -sh ~
```

**✅ チェックポイント**:
- [ ] 空きディスク 50GB 以上 (推奨: 100GB)
- [ ] ホームディレクトリに書き込み権限あり

---

### 3. ネットワーク確認

```bash
# IPアドレス確認
ifconfig en0 | grep "inet "

# 期待される出力:
# inet 192.168.3.27 netmask 0xffffff00 broadcast 192.168.3.255
#      ^^^^^^^^^^^^ このIPを使用

# または
ipconfig getifaddr en0

# ネットワーク接続確認
ping -c 3 8.8.8.8
```

**✅ チェックポイント**:
- [ ] IPアドレス: 192.168.3.27 または 192.168.3.26
- [ ] インターネット接続OK

---

### 4. SSH アクセス確認

```bash
# リモートログイン状態確認
sudo systemsetup -getremotelogin

# 期待される出力:
# Remote Login: On

# OFFの場合は有効化
sudo systemsetup -setremotelogin on

# SSHポート確認
sudo lsof -i :22 | grep LISTEN

# 期待される出力:
# sshd    123 root  5u  IPv6 0x... 0t0  TCP *:ssh (LISTEN)
```

**✅ チェックポイント**:
- [ ] Remote Login: On
- [ ] SSH ポート (22) が LISTEN 状態
- [ ] 開発マシンから SSH 接続可能

**開発マシンからテスト**:
```bash
# 開発マシンで実行
ssh macmini "echo 'SSH OK'"
# または
ssh a003@192.168.3.27 "echo 'SSH OK'"
```

---

## 🔧 Homebrew セットアップ (3分)

### 5. Homebrew インストール確認

```bash
# Homebrew が既にインストールされているか確認
which brew

# 期待される出力:
# /opt/homebrew/bin/brew (Apple Silicon)
# または /usr/local/bin/brew (Intel Mac)

# バージョン確認
brew --version

# 期待される出力:
# Homebrew 4.x.x
```

**インストールされていない場合**:
```bash
# Homebrew インストール
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Apple Silicon の場合、PATH 設定
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# 再度確認
brew --version
```

**✅ チェックポイント**:
- [ ] `brew --version` が動作する
- [ ] PATH に brew が含まれている

---

## 🤖 Ollama インストール (5分)

### 6. Ollama インストール

```bash
# Ollama インストール
brew install ollama

# インストール確認
which ollama
# 期待される出力: /opt/homebrew/bin/ollama

ollama --version
# 期待される出力: ollama version is 0.5.x
```

**✅ チェックポイント**:
- [ ] `ollama --version` が動作する
- [ ] バージョン 0.5.0 以降

---

### 7. Ollama サービス状態確認

```bash
# Ollama プロセスが起動しているか確認
pgrep -fl ollama

# 起動していない場合は何も出力されない

# 手動起動テスト
ollama serve &

# プロセス確認
ps aux | grep ollama | grep -v grep

# 期待される出力:
# user  12345  0.0  0.1  ... /opt/homebrew/bin/ollama serve

# 停止
pkill ollama
```

**✅ チェックポイント**:
- [ ] `ollama serve` が起動できる
- [ ] プロセスが正常に動作

---

## 📦 GPT-OSS-20B モデルダウンロード (15-20分)

### 8. モデルダウンロード

```bash
# モデルダウンロード開始 (約16GB)
ollama pull gpt-oss:20b

# 進捗表示
# pulling manifest
# pulling 4a03f05b1f4a... 100% ▕████████████████▏ 9.5 GB
# pulling fe94d09f12cf... 100% ▕████████████████▏ 6.2 GB
# ...
# success
```

**ダウンロード中の確認**:
```bash
# 別ターミナルで進捗確認
watch -n 5 "ls -lh ~/.ollama/models/blobs/ | tail -5"

# ネットワーク使用量確認
nettop -m tcp -t wifi -L 1 | head -20
```

**✅ チェックポイント**:
- [ ] ダウンロード完了 (約10-20分)
- [ ] "success" メッセージ表示

---

### 9. モデル確認

```bash
# ダウンロード済みモデル一覧
ollama list

# 期待される出力:
# NAME             ID              SIZE    MODIFIED
# gpt-oss:20b      a1b2c3d4e5f6    16 GB   2 minutes ago

# モデル詳細情報
ollama show gpt-oss:20b

# 期待される出力:
# Model
#   arch                 gpt
#   parameters           20.7B
#   context length       128000
#   ...
```

**✅ チェックポイント**:
- [ ] `gpt-oss:20b` が一覧に表示される
- [ ] サイズが約16GB

---

## 🌐 ネットワーク設定 (5分)

### 10. Ollama ネットワーク設定

```bash
# OLLAMA_HOST 環境変数設定
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.zshrc

# 反映
source ~/.zshrc

# 確認
echo $OLLAMA_HOST
# 期待される出力: 0.0.0.0:11434

# または ~/.bash_profile を使用している場合
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.bash_profile
source ~/.bash_profile
```

**✅ チェックポイント**:
- [ ] `echo $OLLAMA_HOST` が `0.0.0.0:11434` を返す

---

### 11. Ollama サーバー起動 (LAN アクセス有効)

```bash
# サーバー起動
ollama serve

# 期待される出力:
# time=2025-10-17T01:00:00.000+09:00 level=INFO source=routes.go:1153 msg="Listening on 0.0.0.0:11434 (version 0.5.2)"
#                                                                                  ^^^^^^^^^^^ LAN からアクセス可能
```

**別ターミナルで確認**:
```bash
# ポート確認
netstat -an | grep 11434

# 期待される出力:
# tcp4  0  0  *.11434  *.*  LISTEN
#             ^^^^^^^ すべてのインターフェースでリッスン

# プロセス確認
lsof -i :11434

# 期待される出力:
# COMMAND  PID  USER  FD  TYPE  DEVICE  SIZE/OFF  NODE  NAME
# ollama   123  user  3u  IPv4  0x...   0t0       TCP   *:11434 (LISTEN)
```

**✅ チェックポイント**:
- [ ] `*.11434` でリッスン (すべてのIP)
- [ ] `127.0.0.1.11434` ではない (localhost のみ)

---

### 12. ローカルホストテスト

```bash
# Mac mini 上でテスト
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Say hello",
  "stream": false
}' | jq '.response'

# 期待される出力:
# "Hello! How can I assist you today?"
```

**✅ チェックポイント**:
- [ ] レスポンスが返ってくる
- [ ] 5-15秒以内に完了

---

### 13. LAN アクセステスト

**Mac mini 側で準備**:
```bash
# IPアドレス確認
ipconfig getifaddr en0
# 出力例: 192.168.3.27

# サーバーが起動していることを確認
pgrep ollama
# PIDが表示されればOK
```

**開発マシンから接続テスト**:
```bash
# 開発マシンで実行
curl http://192.168.3.27:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Write hello world in Rust",
  "stream": false
}' | jq '.response'

# 期待される出力:
# "fn main() {\n    println!(\"Hello, world!\");\n}"
```

**接続できない場合 (Mac mini 側で確認)**:
```bash
# 1. ファイアウォール確認
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# 出力: Firewall is enabled. (Status: 1)

# 2. Ollama を許可
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/ollama
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /opt/homebrew/bin/ollama

# 3. 確認
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps | grep ollama
# 出力: /opt/homebrew/bin/ollama ( Allow incoming connections )

# 4. Ollama 再起動
pkill ollama
OLLAMA_HOST=0.0.0.0:11434 ollama serve &
```

**✅ チェックポイント**:
- [ ] 開発マシンから `192.168.3.27:11434` に接続できる
- [ ] レスポンスが正常に返ってくる

---

## 🔄 自動起動設定 (5分)

### 14. LaunchAgent 作成

```bash
# LaunchAgent plist ファイル作成
cat > ~/Library/LaunchAgents/com.ollama.server.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_HOST</key>
        <string>0.0.0.0:11434</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama.stderr.log</string>
</dict>
</plist>
EOF

# ファイル確認
cat ~/Library/LaunchAgents/com.ollama.server.plist

# 権限設定
chmod 644 ~/Library/LaunchAgents/com.ollama.server.plist
```

**✅ チェックポイント**:
- [ ] plist ファイルが作成された
- [ ] 権限が 644

---

### 15. LaunchAgent 登録・起動

```bash
# 既存の ollama プロセスを停止
pkill ollama

# LaunchAgent 読み込み
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# ステータス確認
launchctl list | grep ollama

# 期待される出力:
# 12345  0  com.ollama.server
# ^^^^^  ^  (PID が表示されればOK)

# プロセス確認
pgrep -fl ollama

# 期待される出力:
# 12345 /opt/homebrew/bin/ollama serve
```

**✅ チェックポイント**:
- [ ] `launchctl list` に `com.ollama.server` が表示される
- [ ] PID が割り当てられている

---

### 16. 自動起動テスト

```bash
# Mac mini を再起動
sudo shutdown -r now

# 再起動後、SSH で接続して確認
ssh macmini

# Ollama が自動起動しているか確認
pgrep -fl ollama

# 期待される出力:
# 123 /opt/homebrew/bin/ollama serve

# API テスト
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Hello",
  "stream": false
}' | jq '.response'
```

**✅ チェックポイント**:
- [ ] 再起動後に自動で Ollama が起動
- [ ] API が正常に動作

---

## 📊 パフォーマンステスト (10分)

### 17. 推論速度テスト

```bash
# シンプルなプロンプト (5-10秒)
time curl -s http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Count from 1 to 5",
  "stream": false
}' | jq '.response'

# 期待される出力:
# "1, 2, 3, 4, 5"
# real    0m8.234s
#         ^^^^^^^^ 5-15秒が正常範囲
```

```bash
# 複雑なプロンプト (10-20秒)
time curl -s http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:20b",
  "prompt": "Explain Rust ownership and borrowing in 3 sentences",
  "stream": false
}' | jq '.response'

# 期待時間: 10-20秒
```

**✅ チェックポイント**:
- [ ] シンプルプロンプト: 5-15秒
- [ ] 複雑プロンプト: 10-20秒

---

### 18. リソース使用量確認

```bash
# メモリ使用量
ps aux | grep ollama | grep -v grep | awk '{print "CPU: "$3"% | Memory: "$4"% | RSS: "$6/1024"MB"}'

# 期待される出力:
# CPU: 15.2% | Memory: 85.3% | RSS: 14336MB
#                      ^^^^^ 16GBマシンで約14-15GB使用は正常

# より詳細な情報
top -pid $(pgrep ollama) -l 1

# 期待される出力:
# PID    COMMAND  %CPU  TIME     #TH  #WQ #POR MEM   PURG CMPR
# 12345  ollama   15.0  10:23.45 23   0   45  14.1G 0B   0B
```

**✅ チェックポイント**:
- [ ] メモリ使用: 14-16GB (16GBマシン)
- [ ] CPU使用: アイドル時 5-10%, 推論時 80-100%

---

### 19. 連続リクエストテスト

```bash
# 10回連続リクエスト
for i in {1..10}; do
  echo "Request $i/10..."
  curl -s http://localhost:11434/api/generate -d "{
    \"model\": \"gpt-oss:20b\",
    \"prompt\": \"Count to $i\",
    \"stream\": false
  }" > /dev/null
  echo "Done"
done

# 各リクエストが 5-15秒で完了すればOK
```

**✅ チェックポイント**:
- [ ] 10回連続で正常に完了
- [ ] レスポンスタイムが安定

---

## 🔍 トラブルシューティング確認

### 20. ログ確認

```bash
# LaunchAgent ログ
tail -f /tmp/ollama.stdout.log
tail -f /tmp/ollama.stderr.log

# システムログ
log show --predicate 'process == "ollama"' --info --last 10m

# エラーがないか確認
grep -i error /tmp/ollama.stderr.log
```

**✅ チェックポイント**:
- [ ] ログにエラーがない
- [ ] 起動メッセージが正常

---

### 21. ディスク使用量監視

```bash
# モデルファイルの場所と容量
du -sh ~/.ollama

# 期待される出力:
# 16G    /Users/user/.ollama

# 内訳
du -sh ~/.ollama/models/blobs/*

# ログファイルの容量
du -sh /tmp/ollama.*.log
```

**✅ チェックポイント**:
- [ ] モデルファイル: 約16GB
- [ ] ログファイル: 数MB以内

---

## 📝 最終確認チェックリスト

### システム確認
- [ ] macOS 12+ / Apple Silicon / 16GB+ RAM
- [ ] ディスク空き容量 50GB+
- [ ] IPアドレス: 192.168.3.27 または .26
- [ ] SSH アクセス有効

### Ollama 確認
- [ ] Homebrew インストール完了
- [ ] Ollama インストール完了 (`ollama --version`)
- [ ] gpt-oss:20b ダウンロード完了 (16GB)
- [ ] `ollama list` でモデル表示

### ネットワーク確認
- [ ] `OLLAMA_HOST=0.0.0.0:11434` 設定
- [ ] ローカルテスト成功 (`curl localhost:11434`)
- [ ] LAN テスト成功 (開発マシンから接続)
- [ ] ファイアウォール許可設定

### 自動起動確認
- [ ] LaunchAgent plist 作成
- [ ] `launchctl load` 完了
- [ ] `launchctl list | grep ollama` でPID表示
- [ ] 再起動後も自動起動確認

### パフォーマンス確認
- [ ] 推論速度: 5-15秒 (シンプル), 10-20秒 (複雑)
- [ ] メモリ使用: 14-16GB
- [ ] 連続リクエスト正常動作

---

## 🎯 完了後の出力例

すべて正常に動作している場合の出力:

```bash
# システム情報
$ sw_vers
ProductName:        macOS
ProductVersion:     14.7.2
BuildVersion:       23H311

# IPアドレス
$ ipconfig getifaddr en0
192.168.3.27

# Ollama バージョン
$ ollama --version
ollama version is 0.5.2

# モデル一覧
$ ollama list
NAME             ID              SIZE    MODIFIED
gpt-oss:20b      a1b2c3d4e5f6    16 GB   1 hour ago

# 環境変数
$ echo $OLLAMA_HOST
0.0.0.0:11434

# プロセス確認
$ pgrep -fl ollama
12345 /opt/homebrew/bin/ollama serve

# ポート確認
$ netstat -an | grep 11434
tcp4  0  0  *.11434  *.*  LISTEN

# LaunchAgent 確認
$ launchctl list | grep ollama
12345  0  com.ollama.server

# API テスト
$ curl -s http://localhost:11434/api/generate -d '{"model":"gpt-oss:20b","prompt":"Hello","stream":false}' | jq '.response'
"Hello! How can I help you today?"
```

---

## 📞 サポート

問題が発生した場合:

1. **ログ確認**: `/tmp/ollama.stderr.log`
2. **プロセス確認**: `pgrep -fl ollama`
3. **ポート確認**: `netstat -an | grep 11434`
4. **再起動**: `launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist && launchctl load ~/Library/LaunchAgents/com.ollama.server.plist`

---

**最終更新**: 2025-10-17
**対象環境**: Mac mini M1/M2/M3 (16GB+)
**所要時間**: 約30-40分 (ダウンロード時間を含む)
