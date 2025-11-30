"""Template file loader."""
from __future__ import annotations
from pathlib import Path

class TemplateLoader:
    """Loads templates from files."""
    def __init__(self, template_dir: str):
        self.template_dir = Path(template_dir)
    
    def load(self, filename: str) -> str:
        """Load template file."""
        path = self.template_dir / filename
        if path.exists():
            return path.read_text()
        raise FileNotFoundError(f"Template not found: {filename}")
    
    def exists(self, filename: str) -> bool:
        """Check if template exists."""
        return (self.template_dir / filename).exists()
    
    def list_templates(self) -> list:
        """List all templates."""
        return [str(p.relative_to(self.template_dir)) 
                for p in self.template_dir.rglob("*.html")]
    
    def get_path(self, filename: str) -> Path:
        """Get full path to template."""
        return self.template_dir / filename
