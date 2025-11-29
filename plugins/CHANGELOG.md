# Changelog

All notable changes to Miyabi Plugin Marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-29

### Added

#### New Plugins
- **miyabi-full**: Complete package with all 25+ Agents, 22 Skills, 50+ Commands
- **miyabi-coding-agents**: 9 Coding Agents (Coordinator, CodeGen, Review, etc.)
- **miyabi-business-agents**: 16 Business Agents (Entrepreneur, Persona, Marketing, etc.)
- **miyabi-skills**: 22 Development Skills (Rust, TDD, Git, Security, etc.)
- **miyabi-commands**: 50+ Slash Commands
- **miyabi-mcp-servers**: 24 MCP Server configurations
- **miyabi-hooks**: Pre/Post Tool Hooks
- **miyabi-honoka**: Udemy Course Creation Agent (穂花)
- **miyabi-water-spider**: System Monitoring Agent
- **miyabi-guardian**: Critical Incident Response Agent

#### Features
- Complete Agent character system with Japanese names
- A2A Bridge for Rust tool integration
- 57-label GitHub Issue classification system
- 13-step Udemy course creation workflow
- 12-phase business planning workflow
- TDD (Red-Green-Refactor) skill
- VOICEVOX voice generation integration
- tmux multi-agent orchestration

#### Documentation
- Comprehensive README for each plugin
- Agent character profiles and backgrounds
- A2A Bridge tool usage examples
- Troubleshooting guides
- Architecture diagrams

### Changed
- Upgraded from v1.0.0 to v2.0.0 with major restructuring
- Plugin source paths updated to `./plugins/` directory
- Enhanced plugin.json with full metadata

### Fixed
- Plugin directory structure alignment with Claude Code spec

---

## [1.0.0] - 2025-11-25

### Added
- Initial marketplace structure
- Basic plugin definitions
- Core Miyabi agents

---

## Plugin Version History

### miyabi-full
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | Complete package release |

### miyabi-coding-agents
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 9 agents with full documentation |

### miyabi-business-agents
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 16 agents with 12-phase workflow |

### miyabi-skills
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 22 skills with SKILL.md |

### miyabi-commands
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 50+ commands documented |

### miyabi-mcp-servers
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 24 server configurations |

### miyabi-hooks
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | Pre/Post hooks with examples |

### miyabi-honoka
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | 13-step Udemy workflow |

### miyabi-water-spider
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | Monitoring & auto-recovery |

### miyabi-guardian
| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-11-29 | Escalation matrix |

---

## Roadmap

### v2.1.0 (Planned)
- [ ] Plugin dependency resolution
- [ ] Cross-plugin communication
- [ ] Plugin marketplace web UI
- [ ] Automated testing for plugins

### v3.0.0 (Future)
- [ ] Plugin hot-reload
- [ ] Multi-language support
- [ ] Plugin analytics
- [ ] Enterprise features
