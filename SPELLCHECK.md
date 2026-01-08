# Spell Check Guide

This project uses `cspell` (Code Spell Checker) to catch spelling errors before pushing changes.

## Quick Commands

**Check all HTML files:**
```bash
npm run spellcheck:html
```

**Check all HTML and JavaScript files:**
```bash
npm run spellcheck
```

## Before Pushing Changes

Run the spell checker before committing:
```bash
npm run spellcheck:html
```

If errors are found, fix them and run the check again.

## Adding New Words

If you encounter legitimate words/acronyms that are flagged as errors, add them to `.cspell.json` in the `words` array.

Common project-specific terms already included:
- BTMS, CHED, MRN, DUCR, GMR, IPAFFS, CDS
- APHA, FNAO, PHSI, POAO (authorities)
- GOV.UK related terms

## Known Issues

The spell checker may flag some words in older version files (v1, v2, v3). These are archived versions and don't need to be fixed unless you're actively working on them.

