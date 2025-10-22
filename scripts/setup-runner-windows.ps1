# GitHub Actions Self-hosted Runner セットアップスクリプト（Windows用）
#
# 使用方法:
#   .\setup-runner-windows.ps1 -RunnerName "windows-gpu" -RegistrationToken "YOUR_TOKEN"
#
# 例:
#   .\setup-runner-windows.ps1 -RunnerName "windows-gpu" -RegistrationToken "ABCD1234..."

param(
    [Parameter(Mandatory=$true)]
    [string]$RegistrationToken,

    [Parameter(Mandatory=$false)]
    [string]$RunnerName = "windows-gpu",

    [Parameter(Mandatory=$false)]
    [string]$OrgUrl = "https://github.com/customer-cloud",

    [Parameter(Mandatory=$false)]
    [string]$RunnerVersion = "2.321.0"
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Info "GitHub Actions Self-hosted Runner セットアップ開始"
Write-Info "Runner名: $RunnerName"
Write-Info "組織: $OrgUrl"
Write-Host ""

# 管理者権限チェック
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error-Custom "このスクリプトは管理者権限で実行してください"
    Write-Info "PowerShell を右クリック → 「管理者として実行」"
    exit 1
}

# 作業ディレクトリ作成
$RunnerDir = "$env:USERPROFILE\actions-runner"
Write-Info "作業ディレクトリ: $RunnerDir"

if (Test-Path $RunnerDir) {
    Write-Warn "既存の Runner ディレクトリが見つかりました: $RunnerDir"
    $response = Read-Host "削除して再インストールしますか? (y/n)"

    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "既存ディレクトリを削除中..."
        Remove-Item -Path $RunnerDir -Recurse -Force
    } else {
        Write-Error-Custom "セットアップを中止しました"
        exit 1
    }
}

New-Item -Path $RunnerDir -ItemType Directory -Force | Out-Null
Set-Location $RunnerDir

# Runner ダウンロード
Write-Info "Runner をダウンロード中..."
$RunnerFile = "actions-runner-win-x64-$RunnerVersion.zip"
$DownloadUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$RunnerFile"

try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $RunnerFile
} catch {
    Write-Error-Custom "ダウンロードに失敗しました: $_"
    exit 1
}

Write-Info "Runner を展開中..."
Expand-Archive -Path $RunnerFile -DestinationPath . -Force
Remove-Item $RunnerFile

# GPU情報取得
Write-Info "GPU情報を取得中..."
$gpuInfo = Get-WmiObject Win32_VideoController | Where-Object { $_.Name -like "*NVIDIA*" }

if ($gpuInfo) {
    $gpuName = $gpuInfo.Name
    Write-Info "検出されたGPU: $gpuName"

    if ($gpuName -like "*4070*") {
        $gpuLabel = "rtx4070"
    } elseif ($gpuName -like "*4060*") {
        $gpuLabel = "rtx4060"
    } else {
        $gpuLabel = "gpu"
    }
} else {
    Write-Warn "NVIDIA GPUが検出されませんでした"
    $gpuLabel = "gpu"
}

# Runner 設定
Write-Info "Runner を設定中..."
$labels = "self-hosted,Windows,X64,gpu,$gpuLabel,docker"

& .\config.cmd --url $OrgUrl `
    --token $RegistrationToken `
    --name $RunnerName `
    --labels $labels `
    --unattended `
    --replace

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Runner の設定に失敗しました"
    exit 1
}

# サービスとして登録
Write-Info "Runner をサービスとして登録中..."
& .\svc.cmd install

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "サービスの登録に失敗しました"
    exit 1
}

# サービス起動
Write-Info "Runner を起動中..."
& .\svc.cmd start

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Runner の起動に失敗しました"
    exit 1
}

Write-Host ""
Write-Info "✅ セットアップ完了！"
Write-Host ""
Write-Info "Runner ステータス確認:"
Write-Host "  .\svc.cmd status"
Write-Host ""
Write-Info "Runner ログ確認:"
Write-Host "  Get-Content $RunnerDir\_diag\Runner_*.log -Wait"
Write-Host ""
Write-Info "Runner 停止:"
Write-Host "  .\svc.cmd stop"
Write-Host ""
Write-Info "Runner アンインストール:"
Write-Host "  .\svc.cmd uninstall"
Write-Host "  Remove-Item -Path $RunnerDir -Recurse -Force"
Write-Host ""
Write-Info "GPU情報確認:"
Write-Host "  nvidia-smi"
Write-Host ""
