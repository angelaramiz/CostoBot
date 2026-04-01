# 👥 Contributors Checklist — CostoBot

> Onboarding guide and contributor best practices

---

## 🚀 New Contributor Setup (15 minutes)

### Step 1: Clone & Install
```bash
git clone https://github.com/angelaramiz/CostoBot.git
cd CostoBot
npm install
cd backend && npm install && cd ..
```

### Step 2: Configure Environment
```bash
# Copy template
cp .env.example .env

# Fill in values (DON'T commit .env):
# - DATABASE_URL (MongoDB Atlas connection string)
# - FIREBASE_* credentials
# - OPENROUTER_API_KEY
# - PUBLIC_API_KEY, INTERNAL_API_KEY
```

### Step 3: Check Context Files
```bash
# Read these in order (20 minutes total):
1. CLAUDE.md                         # 🎯 Master rules
2. PROJECT_CONTEXT.md                # 📋 Architecture overview
3. VERSIONING_MAINTENANCE_GUIDE.md   # 🔄 How to commit
4. .claude/memory/architecture-rules.md  # 🏗️ Technical constraints
```

### Step 4: Run Development
```bash
npm run dev          # Next.js dev server (localhost:3000)
npm run dev:backend  # Express server (localhost:3001)
```

### Step 5: Verify Setup
```bash
# Run tests
npm run test

# Check linting
npm run lint

# Verify context
npm run context:audit
```

---

## 📝 Before Each Commit

### Checklist
- [ ] Code follows TypeScript strict mode (`no any`)
- [ ] Added/updated Zod validators for schema changes
- [ ] All async code uses try/catch + proper error handling
- [ ] Used commit prefix (🐛 fix, ✨ feat, 💥 BREAKING)
- [ ] No hardcoded API keys (use .env)
- [ ] Tested cascade engine if modifying layer 1-3
- [ ] Updated .claude/memory/ if fixing a common pattern

### Commit Conventions
```bash
# Correct format (triggers AUTONOMOUS versioning)
git commit -m "🐛 fix: cascade not updating layer 3"
git commit -m "✨ feat: add export to XLSX"
git commit -m "💥 BREAKING: restructure BusinessProject schema"

# Wrong format (skips versioning)
git commit -m "bug fix: something broken"
git commit -m "added new feature"
```

### How to Test Versioning
```bash
# Make a change
echo "test" >> test.txt
git add .

# Commit with emoji prefix
git commit -m "🐛 fix: test versioning hook"

# Hook runs automatically → version bumped ✅
# Check: cat package.json | grep version
```

---

## 🔍 Code Review Checklist

When reviewing PRs, verify:

### Architecture
- [ ] No `any` types — all interfaces properly typed
- [ ] Cascade engine triggered on layer changes (propagateChange)
- [ ] Defensive array validation before iteration
- [ ] Debounced sync every 5s (frontend → backend)

### Security
- [ ] No API keys in code (all in .env)
- [ ] All IA responses validated with Zod
- [ ] Firebase tokens verified on backend routes
- [ ] Rate limiting headers not bypassed

### Testing
- [ ] Critical paths tested (auth, cascade, calculations)
- [ ] Schema validation tests added
- [ ] At least 70% coverage for changed functions

### Documentation
- [ ] CLAUDE.md updated if adding new rule
- [ ] .claude/memory/corrections-log.md updated if fixing common error
- [ ] comments added to complex logic

---

## 🛠️ Common Tasks

### Add a New Layer or Sheet
1. Define TypeScript interface in `types/`
2. Create Zod validator in `validators/`
3. Add to `BusinessProject` schema
4. Implement cascade logic in `services/calculation/cascade-engine.ts`
5. Add tests in `.test.ts` file
6. Commit: `✨ feat: add Layer5 Envases`

### Fix a Recurring Bug
1. Fix the bug in code
2. Add test case
3. Document in `.claude/memory/corrections-log.md`
4. Commit: `🐛 fix: [description]`

### Update Security
1. Fix CVE or rotate API key
2. Update `.claude/memory/security-audit.md`
3. Commit: `🔒 sec: [description]`

### Improve Documentation
1. Update relevant `.md` file
2. Commit: `📝 docs: [description]`
   - ⚠️ Does NOT trigger versioning

---

## 📚 Reference

| File | Purpose | Audience |
|------|---------|----------|
| CLAUDE.md | Master rules & conventions | All contributors |
| PROJECT_CONTEXT.md | Architecture & stack overview | New contributors |
| VERSIONING_MAINTENANCE_GUIDE.md | How to bump versions | Release managers |
| architecture-rules.md | Technical constraints | Backend/cascade engineers |
| security-audit.md | CVEs & key rotation | Security lead |
| corrections-log.md | Common errors & fixes | All contributors |

---

## 🆘 Getting Help

- **Questions about rules?** → Read CLAUDE.md § "Core Rules"
- **Architecture question?** → Read PROJECT_CONTEXT.md
- **How to commit?** → Read versioning-rules.md
- **Bug keeps recurring?** → Check corrections-log.md
- **Security issue?** → Update security-audit.md + contact lead

---

## ✅ Offboarding Checklist

When leaving the project:
- [ ] Remove any local .env file (never commit)
- [ ] Rotate API keys you had access to
- [ ] Close any open PRs or hand off to another contributor
- [ ] Update this file if you found better practices
