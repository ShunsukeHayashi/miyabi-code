#!/usr/bin/env python3
"""
Miyabi PlantUML Generator
Generates PlantUML diagrams from YAML definitions.

Usage:
    python generate_puml.py [--output-dir diagrams]
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, Any, List

try:
    import yaml
except ImportError:
    print("Error: PyYAML not installed.")
    print("Please install: pip install pyyaml")
    sys.exit(1)


class PlantUMLGenerator:
    """Generator for PlantUML diagrams from Miyabi YAML definitions."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.generated_dir = base_dir / "generated"
        self.output_dir = base_dir / "diagrams"

    def load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load a YAML file from the generated directory."""
        filepath = self.generated_dir / filename
        if not filepath.exists():
            print(f"Warning: File not found: {filepath}")
            return {}

        with open(filepath, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}

    def generate_entity_diagram(self):
        """Generate entity relationship diagram."""
        entities_data = self.load_yaml("entities.yaml")
        relations_data = self.load_yaml("relations.yaml")

        if not entities_data:
            print("Warning: No entities data found")
            return

        puml = []
        puml.append("@startuml miyabi_entities")
        puml.append("")
        puml.append("!define ENTITY class")
        puml.append("")
        puml.append("title Miyabi Entity-Relation Model (14 Entities)")
        puml.append("")

        # Add entities (handle nested structure)
        if "entities" in entities_data and "definitions" in entities_data["entities"]:
            definitions = entities_data["entities"]["definitions"]

            for entity_key, entity_data in definitions.items():
                if not isinstance(entity_data, dict):
                    continue

                name = entity_data.get("name", entity_key)
                desc = entity_data.get("description", "")

                puml.append(f"class {name} {{")
                if desc:
                    puml.append(f"  ' {desc}")

                # Add key attributes if available
                attributes = entity_data.get("attributes", {})
                if isinstance(attributes, dict):
                    for attr_group, attr_list in attributes.items():
                        if isinstance(attr_list, list):
                            for attr in attr_list[:3]:  # Limit to 3 key attributes
                                if isinstance(attr, dict):
                                    attr_name = attr.get("name", "")
                                    if attr_name:
                                        puml.append(f"  +{attr_name}")

                puml.append("}")
                puml.append("")

        # Add relations (handle nested structure)
        if "relations" in relations_data and "definitions" in relations_data["relations"]:
            puml.append("' Relations")
            definitions = relations_data["relations"]["definitions"]

            for rel_key, rel_data in definitions.items():
                if not isinstance(rel_data, dict):
                    continue

                from_entity = rel_data.get("from", "")
                to_entity = rel_data.get("to", "")
                rel_type = rel_data.get("type", "association")
                label = rel_data.get("description", "")

                arrow = "-->"
                if "composition" in rel_type:
                    arrow = "*--"
                elif "aggregation" in rel_type:
                    arrow = "o--"
                elif "inheritance" in rel_type:
                    arrow = "--|>"

                if label and len(label) < 30:  # Only show short labels
                    puml.append(f"{from_entity} {arrow} {to_entity} : {label}")
                else:
                    puml.append(f"{from_entity} {arrow} {to_entity}")

        puml.append("")
        puml.append("@enduml")

        return "\n".join(puml)

    def generate_agent_diagram(self):
        """Generate agent architecture diagram."""
        agents_data = self.load_yaml("agents.yaml")

        if not agents_data or "agents" not in agents_data:
            print("Warning: No agents data found")
            return

        puml = []
        puml.append("@startuml miyabi_agents")
        puml.append("")
        puml.append("title Miyabi Agent Architecture (21 Agents: 7 Coding + 14 Business)")
        puml.append("")

        # Extract coding and business agents
        coding_agents_data = agents_data.get("agents", {}).get("coding_agents", {})
        business_agents_data = agents_data.get("agents", {}).get("business_agents", {})

        # Coding agents package
        if "agents" in coding_agents_data:
            puml.append("package \"Coding Agents (7)\" {")
            for agent in coding_agents_data["agents"]:
                name = agent.get("name", "Unknown")
                role = agent.get("role", "")
                desc = agent.get("description", "")
                puml.append(f"  component [{name}] as {name}")
                if desc and len(desc) < 50:
                    puml.append(f"  note right of {name}: {desc[:40]}")
            puml.append("}")
            puml.append("")

        # Business agents package
        if "agents" in business_agents_data:
            puml.append("package \"Business Agents (14)\" {")

            # Group by category
            strategy_agents = []
            marketing_agents = []
            sales_agents = []

            for agent in business_agents_data["agents"]:
                category = agent.get("category", "")
                if "strategy" in category or "planning" in category:
                    strategy_agents.append(agent)
                elif "marketing" in category or "content" in category:
                    marketing_agents.append(agent)
                else:
                    sales_agents.append(agent)

            # Strategy & Planning
            if strategy_agents:
                puml.append("  package \"Strategy & Planning\" {")
                for agent in strategy_agents:
                    name = agent.get("name", "Unknown")
                    puml.append(f"    component [{name}]")
                puml.append("  }")

            # Marketing & Content
            if marketing_agents:
                puml.append("  package \"Marketing & Content\" {")
                for agent in marketing_agents:
                    name = agent.get("name", "Unknown")
                    puml.append(f"    component [{name}]")
                puml.append("  }")

            # Sales & CRM
            if sales_agents:
                puml.append("  package \"Sales & CRM\" {")
                for agent in sales_agents:
                    name = agent.get("name", "Unknown")
                    puml.append(f"    component [{name}]")
                puml.append("  }")

            puml.append("}")
            puml.append("")

        puml.append("@enduml")

        return "\n".join(puml)

    def generate_workflow_diagram(self):
        """Generate workflow sequence diagram."""
        workflows_data = self.load_yaml("workflows.yaml")

        if not workflows_data or "workflows" not in workflows_data:
            print("Warning: No workflows data found")
            return

        puml = []
        puml.append("@startuml miyabi_workflow")
        puml.append("")
        puml.append("title Miyabi Workflow Execution")
        puml.append("")

        # Add actors
        puml.append("actor User")
        puml.append("participant CoordinatorAgent")
        puml.append("participant CodeGenAgent")
        puml.append("participant ReviewAgent")
        puml.append("participant PRAgent")
        puml.append("")

        # Add workflow steps
        puml.append("User -> CoordinatorAgent: Create Issue")
        puml.append("activate CoordinatorAgent")
        puml.append("CoordinatorAgent -> CoordinatorAgent: Analyze & Plan")
        puml.append("CoordinatorAgent -> CodeGenAgent: Generate Code")
        puml.append("activate CodeGenAgent")
        puml.append("CodeGenAgent -> CodeGenAgent: Implement")
        puml.append("CodeGenAgent --> CoordinatorAgent: Code Complete")
        puml.append("deactivate CodeGenAgent")
        puml.append("CoordinatorAgent -> ReviewAgent: Review Code")
        puml.append("activate ReviewAgent")
        puml.append("ReviewAgent -> ReviewAgent: Quality Check")
        puml.append("ReviewAgent --> CoordinatorAgent: Review Complete")
        puml.append("deactivate ReviewAgent")
        puml.append("CoordinatorAgent -> PRAgent: Create PR")
        puml.append("activate PRAgent")
        puml.append("PRAgent -> PRAgent: Generate PR")
        puml.append("PRAgent --> User: PR Created")
        puml.append("deactivate PRAgent")
        puml.append("deactivate CoordinatorAgent")
        puml.append("")
        puml.append("@enduml")

        return "\n".join(puml)

    def generate_all(self):
        """Generate all PlantUML diagrams."""
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

        print("\n=== Generating PlantUML Diagrams ===\n")

        diagrams = {
            "entities.puml": self.generate_entity_diagram,
            "agents.puml": self.generate_agent_diagram,
            "workflow.puml": self.generate_workflow_diagram,
        }

        for filename, generator_func in diagrams.items():
            output_path = self.output_dir / filename

            print(f"Generating: {filename}")
            try:
                content = generator_func()
                if content:
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✓ Generated: {output_path} ({len(content)} bytes)")
                else:
                    print(f"  ⚠  Skipped: No content generated")
            except Exception as e:
                print(f"  ✗ Error: {e}")

            print()

        print(f"=== Generation Complete ===")
        print(f"Output directory: {self.output_dir}")
        print(f"Generated diagrams: {len(list(self.output_dir.glob('*.puml')))}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate PlantUML diagrams from Miyabi YAML definitions"
    )
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path(__file__).parent,
        help="Base directory containing generated YAML files"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory for PlantUML files (default: base_dir/diagrams)"
    )

    args = parser.parse_args()

    # Initialize generator
    generator = PlantUMLGenerator(args.base_dir)

    if args.output_dir:
        generator.output_dir = args.output_dir

    print("=" * 60)
    print("Miyabi PlantUML Generator")
    print("=" * 60)
    generator.generate_all()


if __name__ == "__main__":
    main()
