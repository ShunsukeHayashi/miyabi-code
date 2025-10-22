#!/bin/bash
# GitHub Actions ワークフローをSelf-hosted runnerに移行するスクリプト

set -e

WORKFLOWS_DIR=".github/workflows"
BACKUP_DIR=".github/workflows/.backup-$(date +%Y%m%d-%H%M%S)"

echo "🔧 GitHub Actions Self-hosted Runner 移行スクリプト"
echo "=================================================="
echo ""

# バックアップディレクトリ作成
echo "📁 バックアップディレクトリ作成: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# GitHub-hostedランナーを使用しているワークフローを検索
echo ""
echo "🔍 GitHub-hostedランナーを使用しているワークフロー:"
echo ""

GITHUB_HOSTED_FILES=$(grep -l "runs-on:.*ubuntu-latest\|runs-on:.*macos-latest\|runs-on:.*windows-latest" "$WORKFLOWS_DIR"/*.yml 2>/dev/null | grep -v ".disabled" || true)

if [ -z "$GITHUB_HOSTED_FILES" ]; then
    echo "✅ 全てのワークフローが既にself-hostedに移行済みです"
    exit 0
fi

echo "$GITHUB_HOSTED_FILES" | while read -r file; do
    echo "  - $(basename "$file")"
done

echo ""
echo "📊 変更対象: $(echo "$GITHUB_HOSTED_FILES" | wc -l | tr -d ' ') ファイル"
echo ""

# 確認プロンプト（自動実行の場合はスキップ）
if [ "${AUTO_YES}" != "1" ]; then
    read -p "これらのワークフローをself-hostedに変更しますか？ (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "❌ キャンセルしました"
        exit 1
    fi
fi

echo ""
echo "🚀 変更開始..."
echo ""

# 各ファイルを変更
echo "$GITHUB_HOSTED_FILES" | while read -r file; do
    filename=$(basename "$file")
    echo "  📝 変更中: $filename"

    # バックアップ
    cp "$file" "$BACKUP_DIR/"

    # ubuntu-latest → self-hosted
    sed -i '' 's/runs-on: ubuntu-latest/runs-on: self-hosted/g' "$file"

    # macos-latest → [self-hosted, macOS, arm64, miyabi-light]
    sed -i '' 's/runs-on: macos-latest/runs-on: [self-hosted, macOS, arm64, miyabi-light]/g' "$file"

    # windows-latest → self-hosted（Windowsランナーがある場合）
    sed -i '' 's/runs-on: windows-latest/runs-on: self-hosted/g' "$file"

    echo "     ✅ 完了"
done

echo ""
echo "✅ 移行完了！"
echo ""
echo "📋 サマリー:"
echo "  - バックアップ: $BACKUP_DIR"
echo "  - 変更ファイル数: $(echo "$GITHUB_HOSTED_FILES" | wc -l | tr -d ' ')"
echo ""
echo "🔍 次のステップ:"
echo "  1. git diff で変更内容を確認"
echo "  2. git add .github/workflows/*.yml"
echo "  3. git commit -m 'ci: migrate to self-hosted runners'"
echo "  4. git push"
echo ""
echo "⚠️  注意: Self-hosted runnerが正しく設定されていることを確認してください"
echo "   確認コマンド: gh api repos/{owner}/{repo}/actions/runners"
echo ""
