#!/bin/bash
# Generate PlantUML diagram

if command -v plantuml &> /dev/null; then
    plantuml -tpng integration-diagram.puml
    echo "PNG generated: integration-diagram.png"
elif command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd):/data" plantuml/plantuml integration-diagram.puml
    echo "PNG generated via Docker: integration-diagram.png"
else
    echo "PlantUML not available. Please install via:"
    echo "  brew install plantuml"
    echo "Or use online editor: https://www.plantuml.com/plantuml/"
fi
