# Versioning Rules — CostoBot

## Configuration
- **Mode:** AUTONOMOUS (post-commit hook para versionamiento automático)
- **Architecture:** Mode A (Separated frontend/backend)
- **Main branch:** main
- **Frontend path:** frontend/ (en este workspace, repo: https://github.com/angelaramiz/CostoBot.git)
- **Backend:** En workspace + Render (separado para producción)
- **DB:** MongoDB Atlas

## Commit Prefixes (AUTONOMOUS only)
| Prefix | Version Bump | Example |
|--------|--------------|---------|
| 🐛 fix / fix: | PATCH | `git commit -m "🐛 fix: cascade not updating layer 3"` |
| ✨ feat / feature: | MINOR | `git commit -m "✨ feat: add export to XLSX"` |
| 💥 BREAKING | MAJOR | `git commit -m "💥 BREAKING: restructure BusinessProject schema"` |
| Other | No bump | Commit stays local, no auto-push |

## Available Commands

### Versioning
```bash
npm run version:patch "fix message"    # Manual PATCH bump
npm run version:minor "feat message"   # Manual MINOR bump
npm run version:major "break message"  # Manual MAJOR bump
npm run version:setup-hooks            # Install post-commit hook
npm run version:uninstall-hooks        # Disable hook temporarily
npm run version:setup-security         # Rotate API keys (every 6 months)
npm run version:audit                  # Health check of versioning system
npm run version:rescale                # Architecture migration wizard
```

### Context & Memory
```bash
npm run context:audit                  # Verify context files up-to-date
npm run context:update                 # Re-scan and refresh PROJECT_CONTEXT.md
npm run context:adr "titulo"           # Add new Architecture Decision Record
npm run rules:add "descripción"        # Add rule to CLAUDE.md
npm run rules:list                     # Show all active rules
npm run memory:export                  # Export .claude/ as ZIP
npm run memory:import backup.zip       # Restore .claude/ from ZIP
```

## Security
- Throttling: 12h per route for `/api/version` checks
- Rate limiting: 100 req/15min (general), 5 req/min (strict)
- API Key rotation: every 6 months
- **Next rotation due:** 19/09/2026

## Version History
| Version | Date | Type | Description |
|---------|------|------|-------------|
| 0.0.1 | 19/03/2026 | — | Initial setup (AUTONOMOUS versionamiento) |

## Mandatory Protocols
- **Implementation roadmap**: Always create `IMPLEMENTATION_ROADMAP.md` before starting any process; mark items ✅ as each phase completes; review at the end
- **Roadmap validation**: Never declare a process "done" without reviewing the roadmap and showing the Final Validation Summary to the user
- **Post-commit hook workflow**:
  1. Developer commits with emoji prefix (🐛 ✨ 💥)
  2. Hook runs automatically
  3. System prompts: "Versionar y pushear? (y/n)"
  4. On confirm: version bumped, `RELEASE_NOTES.md` regenerated, Git tag created, auto-push triggered
  5. On deny: commit stays local (can redo if needed)
- **No versioning on backend**: Only frontend (this repo) triggers version bumps via hook
