<p align="center">
  <a href="https://miyabi.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="MiyabiCode logo">
    </picture>
  </a>
</p>
<p align="center">Miyabi - Japanese autonomous AI coding agent powered by GLM-4.7</p>
<p align="center">
  <a href="https://miyabi.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/miyabi-code"><img alt="npm" src="https://img.shields.io/npm/v/miyabi-code?style=flat-square" /></a>
  <a href="https://github.com/ShunsukeHayashi/miyabi-code/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/ShunsukeHayashi/miyabi-code/publish.yml?style=flat-square&branch=main" /></a>
</p>

---

![MiyabiCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://miyabi.ai)

---

### Installation

```bash
# YOLO
curl -fsSL https://miyabi.ai/install | bash

# Package managers
npm i -g miyabi-code@latest        # or bun/pnpm/yarn
scoop bucket add extras; scoop install extras/miyabi-code  # Windows
choco install miyabi-code             # Windows
brew install ShunsukeHayashi/tap/miyabi-code # macOS and Linux (recommended, always up to date)
brew install miyabi-code              # macOS and Linux (official brew formula, updated less)
paru -S miyabi-code-bin               # Arch Linux
mise use -g miyabi-code               # Any OS
nix run nixpkgs#miyabi-code           # or github:ShunsukeHayashi/miyabi-code for latest dev branch
```

> [!TIP]
> Remove versions older than 1.0.0 before installing.

### Desktop App (BETA)

MiyabiCode is also available as a desktop application. Download directly from the [releases page](https://github.com/ShunsukeHayashi/miyabi-code/releases) or [miyabi.ai/download](https://miyabi.ai/download).

| Platform              | Download                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `miyabi-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `miyabi-desktop-darwin-x64.dmg`     |
| Windows               | `miyabi-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm`, or AppImage           |

```bash
# macOS (Homebrew)
brew install --cask miyabi-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$MIYABI_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if exists or can be created)
4. `$HOME/.miyabi/bin` - Default fallback

```bash
# Examples
MIYABI_INSTALL_DIR=/usr/local/bin curl -fsSL https://miyabi.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://miyabi.ai/install | bash
```

### Agents

MiyabiCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full access agent for development work
- **plan** - Read-only agent for analysis and code exploration
   - Denies file edits by default
   - Asks permission before running bash commands
   - Ideal for exploring unfamiliar codebases or planning changes

Also, included is a **general** subagent for complex searches and multistep tasks. This is used internally and can be invoked using `@general` in messages.

**Default Model: GLM-4.7 (Zhipu AI)**

Learn more about [agents](https://miyabi.ai/docs/agents).

### Documentation

For more info on how to configure MiyabiCode [**head over to our docs**](https://miyabi.ai/docs).

### Contributing

If you're interested in contributing to MiyabiCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on MiyabiCode

If you are working on a project that's related to Miyabi and is using "miyabi" as a part of its name; for example, "miyabi-dashboard" or "miyabi-mobile", please add a note to your README to clarify that it is not built by Miyabi team and is not affiliated with us in any way.

### FAQ

#### How is this different from Claude Code?

It's very similar to Claude Code in terms of capability. Here are the key differences:

- 100% open source
- Provider-agnostic design with GLM-4.7 as default model (also supports Claude, OpenAI, Google)
- Out of the box LSP support
- A focus on TUI. MiyabiCode is built by neovim users and optimized for Japanese development
- A client/server architecture. This for example can allow MiyabiCode to run on your computer, while you can drive it remotely from a mobile app. Meaning that the TUI frontend is just one of the possible clients.

#### What is GLM-4.7?

GLM-4.7 is Zhipu AI's latest large language model, optimized for Japanese language understanding and code generation. It provides:

- Superior Japanese language support compared to other models
- Strong coding capabilities with 128K context window
- Efficient pricing for enterprise use
- API compatibility with OpenAI format

---

**Join our community** [Discord](https://discord.gg/miyabi) | [X.com](https://x.com/miyabi)
