#!/usr/bin/env python3
"""
Widget Reference Validator

This script validates that all widget references in tool definition files
correspond to actual files in server/widgets/ directory.

Usage:
    python scripts/validate_widget_refs.py
    
Exit codes:
    0 - All widget references are valid
    1 - One or more widget references are invalid
"""

import re
import sys
from pathlib import Path

# Get the miyabi-app root (parent of scripts directory)
SCRIPT_DIR = Path(__file__).parent.resolve()
MIYABI_APP_ROOT = SCRIPT_DIR.parent
WIDGETS_DIR = MIYABI_APP_ROOT / "server" / "widgets"
TOOLS_DIR = MIYABI_APP_ROOT / "server" / "tools"


def get_widget_files() -> set[str]:
    """Get all widget HTML files in the widgets directory."""
    if not WIDGETS_DIR.exists():
        print(f"❌ Widgets directory not found: {WIDGETS_DIR}")
        return set()
    
    return {f.name for f in WIDGETS_DIR.glob("*.html")}


def get_widget_references_from_file(file_path: Path) -> list[tuple[str, int]]:
    """Extract all widget references from a Python file with line numbers."""
    if not file_path.exists():
        return []
    
    references = []
    pattern = re.compile(r'ui://widget/([a-zA-Z0-9_-]+\.html)')
    
    with open(file_path, "r") as f:
        for line_num, line in enumerate(f, 1):
            for match in pattern.finditer(line):
                references.append((match.group(1), line_num))
    
    return references


def get_widget_map_entries(file_path: Path) -> list[tuple[str, int]]:
    """Extract all WIDGET_MAP entries from a file with line numbers."""
    if not file_path.exists():
        return []
    
    entries = []
    pattern = re.compile(r'"([a-zA-Z0-9_-]+\.html)"')
    in_widget_map = False
    
    with open(file_path, "r") as f:
        for line_num, line in enumerate(f, 1):
            if "WIDGET_MAP" in line and "=" in line:
                in_widget_map = True
            elif in_widget_map:
                if line.strip() == "}":
                    in_widget_map = False
                else:
                    for match in pattern.finditer(line):
                        entries.append((match.group(1), line_num))
    
    return entries


def validate_widgets() -> bool:
    """Validate all widget references."""
    print("🔍 Miyabi Widget Reference Validator\n")
    print("=" * 60)
    print(f"📂 App root: {MIYABI_APP_ROOT}")
    print(f"📂 Widgets dir: {WIDGETS_DIR}")
    print(f"📂 Tools dir: {TOOLS_DIR}")
    
    widget_files = get_widget_files()
    print(f"\n📁 Found {len(widget_files)} widget files in server/widgets/")
    
    if not TOOLS_DIR.exists():
        print(f"❌ Tools directory not found: {TOOLS_DIR}")
        return False
    
    all_valid = True
    total_refs = 0
    
    # Find all Python files in tools directory
    tool_files = list(TOOLS_DIR.glob("*.py"))
    print(f"📝 Scanning {len(tool_files)} tool definition files\n")
    
    for tool_file in sorted(tool_files):
        # Get direct references
        direct_refs = get_widget_references_from_file(tool_file)
        
        # Get WIDGET_MAP entries (only for ui_tools.py)
        map_entries = []
        if tool_file.name == "ui_tools.py":
            map_entries = get_widget_map_entries(tool_file)
        
        if not direct_refs and not map_entries:
            continue
        
        print(f"\n📄 {tool_file.name}")
        print("-" * 40)
        
        # Validate direct references
        if direct_refs:
            for ref, line_num in direct_refs:
                total_refs += 1
                if ref in widget_files:
                    print(f"   ✅ Line {line_num:3d}: {ref}")
                else:
                    print(f"   ❌ Line {line_num:3d}: {ref} (NOT FOUND)")
                    all_valid = False
        
        # Validate WIDGET_MAP entries
        if map_entries:
            print(f"\n   🗺️  WIDGET_MAP entries:")
            for entry, line_num in map_entries:
                total_refs += 1
                if entry in widget_files:
                    print(f"   ✅ Line {line_num:3d}: {entry}")
                else:
                    print(f"   ❌ Line {line_num:3d}: {entry} (NOT FOUND)")
                    all_valid = False
    
    # Summary
    print("\n" + "=" * 60)
    print(f"\n📊 Summary: {total_refs} total references checked")
    
    if all_valid:
        print("✅ All widget references are valid!")
    else:
        print("❌ Some widget references are invalid!")
        print("\n💡 Available widgets:")
        for widget in sorted(widget_files):
            print(f"   - {widget}")
    
    return all_valid


def main():
    success = validate_widgets()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
