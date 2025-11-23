# Pixel Home Control (Termux:Widget)

軽量なホーム画面制御スクリプト。Termux:Widget からワンタップでアプリ起動やWi-Fi/ADB操作ができます。

## セットアップ
1. Termux と Termux:API をインストール（F-Droid推奨）。
2. Termux でリポジトリをclone済みであれば、以下を実行:
   ```bash
   cd /path/to/miyabi-private
   bash tools/pixel-home-control/pixel-quick-setup.sh
   ```
3. ホーム画面長押し → ウィジェット → Termux:Widget → `termux-home-screen-control.sh` を配置。

## 使い方
- デフォルト：Chrome を起動  
  `./termux-home-screen-control.sh`
- アプリ指定起動  
  `./termux-home-screen-control.sh open gmail`  
  対応: chrome | gmail | settings | messages | drive | termux
- Wi-Fi ON/OFF  
  `./termux-home-screen-control.sh wifi-on` / `wifi-off`
- 無線ADB（root端末のみ）  
  `./termux-home-screen-control.sh adb-wifi`  
  出力された `adb connect <ip>:5555` をPCで実行。

## カスタマイズ
- デフォルト起動アプリを変更: `APP_DEFAULT=drive` のようにスクリプト先頭を編集。
- ショートカットを複数置けば、アプリ別のワンタップランチャーとして利用可能。
