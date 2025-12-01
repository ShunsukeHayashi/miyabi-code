#!/usr/bin/env python3
"""
Quick environment check before TCG card generation
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check if environment is ready for TCG generation"""
    print("=" * 60)
    print("MIYABI TCG Card Generation - Environment Check")
    print("=" * 60)

    issues = []

    # Check 1: Python version
    print("\n1. Python Version")
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        issues.append("Python 3.7+ required")
    else:
        print("   ✓ OK")

    # Check 2: BytePlus API Key
    print("\n2. BytePlus API Key")
    api_key = os.getenv("BYTEPLUS_API_KEY")
    if not api_key:
        print("   ✗ NOT SET")
        issues.append("BYTEPLUS_API_KEY environment variable not set")
        print("   Set with: export BYTEPLUS_API_KEY='your-key-here'")
    else:
        masked_key = api_key[:10] + "..." + api_key[-4:] if len(api_key) > 14 else "***"
        print(f"   ✓ Set: {masked_key}")

    # Check 3: requests library
    print("\n3. Python Requests Library")
    try:
        import requests
        print(f"   ✓ Installed: {requests.__version__}")
    except ImportError:
        print("   ✗ NOT INSTALLED")
        issues.append("requests library not installed")
        print("   Install with: pip install requests")

    # Check 4: Output directory
    print("\n4. Output Directory")
    output_dir = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards")
    print(f"   {output_dir}")
    if output_dir.exists():
        print("   ✓ Exists")
        # Count existing cards
        existing = list(output_dir.glob("*_unified_*.png"))
        print(f"   Existing cards: {len(existing)}")
    else:
        print("   ⚠ Does not exist (will be created)")

    # Check 5: Reference cards
    print("\n5. Reference Cards (for style)")
    ref1 = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards/shikiroon_unified_SSR.png")
    ref2 = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards/tsukuroon_unified_SR.png")

    if ref1.exists():
        print(f"   ✓ shikiroon_unified_SSR.png ({ref1.stat().st_size // 1024} KB)")
    else:
        print("   ⚠ shikiroon_unified_SSR.png not found")

    if ref2.exists():
        print(f"   ✓ tsukuroon_unified_SR.png ({ref2.stat().st_size // 1024} KB)")
    else:
        print("   ⚠ tsukuroon_unified_SR.png not found")

    # Summary
    print("\n" + "=" * 60)
    if issues:
        print("❌ Environment Check FAILED")
        print("\nIssues found:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        print("\nPlease fix the issues above before running the generator.")
        return False
    else:
        print("✅ Environment Check PASSED")
        print("\nYou can now run:")
        print("  python3 scripts/generate_tcg_cards.py")
        return True

    print("=" * 60)

if __name__ == "__main__":
    success = check_environment()
    sys.exit(0 if success else 1)
