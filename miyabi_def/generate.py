#!/usr/bin/env python3
"""
Miyabi Definition Generator
Renders Jinja2 templates with YAML variables to generate complete definition files.

Usage:
    python generate.py [--output-dir generated]
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, Any

try:
    import yaml
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("Error: Required packages not installed.")
    print("Please install: pip install pyyaml jinja2")
    sys.exit(1)


class MiyabiDefinitionGenerator:
    """Generator for Miyabi definition YAML files from Jinja2 templates."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.variables_dir = base_dir / "variables"
        self.templates_dir = base_dir / "templates"
        self.output_dir = base_dir / "generated"

        # Load Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def load_all_variables(self) -> Dict[str, Any]:
        """Load all YAML variable files from the variables directory."""
        variables = {}

        if not self.variables_dir.exists():
            print(f"Warning: Variables directory not found: {self.variables_dir}")
            return variables

        for yaml_file in self.variables_dir.glob("*.yaml"):
            print(f"Loading variables from: {yaml_file.name}")
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if data:
                    variables.update(data)

        return variables

    def render_template(self, template_name: str, variables: Dict[str, Any]) -> str:
        """Render a Jinja2 template with the given variables."""
        template = self.env.get_template(template_name)
        return template.render(**variables)

    def generate_all(self):
        """Generate all definition files from templates."""
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Load all variables
        print("\n=== Loading Variables ===")
        variables = self.load_all_variables()

        if not variables:
            print("Error: No variables loaded. Cannot generate files.")
            return

        print(f"\nLoaded variables: {', '.join(variables.keys())}")

        # Find all template files
        print("\n=== Generating Definition Files ===")
        template_files = list(self.templates_dir.glob("*.j2"))

        if not template_files:
            print(f"Warning: No template files found in {self.templates_dir}")
            return

        for template_file in template_files:
            # Skip base.yaml.j2 as it's only for inheritance
            if template_file.name == "base.yaml.j2":
                continue

            output_filename = template_file.stem  # Remove .j2 extension
            output_path = self.output_dir / output_filename

            print(f"\nRendering: {template_file.name}")
            print(f"  Output: {output_path}")

            try:
                rendered_content = self.render_template(template_file.name, variables)

                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(rendered_content)

                print(f"  ✓ Generated successfully ({len(rendered_content)} bytes)")

            except Exception as e:
                print(f"  ✗ Error rendering template: {e}")

        print(f"\n=== Generation Complete ===")
        print(f"Output directory: {self.output_dir}")
        print(f"Generated files: {len(list(self.output_dir.glob('*.yaml')))}")

    def list_templates(self):
        """List all available templates."""
        print("\n=== Available Templates ===")
        template_files = list(self.templates_dir.glob("*.j2"))

        for template_file in template_files:
            print(f"  - {template_file.name}")

        print(f"\nTotal: {len(template_files)} templates")

    def list_variables(self):
        """List all available variable files."""
        print("\n=== Available Variables ===")
        variable_files = list(self.variables_dir.glob("*.yaml"))

        for var_file in variable_files:
            print(f"  - {var_file.name}")

        print(f"\nTotal: {len(variable_files)} variable files")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Miyabi definition YAML files from Jinja2 templates"
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path(__file__).parent,
        help="Base directory containing templates and variables (default: current directory)"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory for generated files (default: base_dir/generated)"
    )
    parser.add_argument(
        "--list-templates",
        action="store_true",
        help="List all available templates"
    )
    parser.add_argument(
        "--list-variables",
        action="store_true",
        help="List all available variable files"
    )

    args = parser.parse_args()

    # Initialize generator
    generator = MiyabiDefinitionGenerator(args.base_dir)

    if args.output_dir:
        generator.output_dir = args.output_dir

    # Execute requested action
    if args.list_templates:
        generator.list_templates()
    elif args.list_variables:
        generator.list_variables()
    else:
        print("=" * 60)
        print("Miyabi Definition Generator")
        print("=" * 60)
        generator.generate_all()


if __name__ == "__main__":
    main()
