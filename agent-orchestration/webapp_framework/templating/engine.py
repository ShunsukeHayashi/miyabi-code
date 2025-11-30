"""Template rendering engine."""
from __future__ import annotations
from typing import Dict, Any
import re

class TemplateEngine:
    """Renders templates."""
    def __init__(self):
        self._templates: Dict[str, str] = {}
    
    def register_template(self, name: str, content: str) -> None:
        """Register template."""
        self._templates[name] = content
    
    def render(self, name: str, context: Dict[str, Any]) -> str:
        """Render template with context."""
        template = self._templates.get(name, "")
        return self._render_string(template, context)
    
    def _render_string(self, template: str, context: Dict[str, Any]) -> str:
        """Render template string."""
        def replace_var(match):
            var_name = match.group(1)
            return str(context.get(var_name, ""))
        return re.sub(r"\{\{\s*(\w+)\s*\}\}", replace_var, template)
    
    def render_string(self, template: str, context: Dict[str, Any]) -> str:
        """Render template string directly."""
        return self._render_string(template, context)
    
    def has_template(self, name: str) -> bool:
        """Check if template exists."""
        return name in self._templates
    
    def delete_template(self, name: str) -> bool:
        """Delete template."""
        if name in self._templates:
            del self._templates[name]
            return True
        return False
    
    def clear_templates(self) -> None:
        """Clear all templates."""
        self._templates.clear()
