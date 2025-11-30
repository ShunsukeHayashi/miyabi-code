# Quick Start Guide

## Creating Your First App

1. Import the framework:
```python
from webapp_framework.core.application import Application
```

2. Create an application:
```python
app = Application("MyApp")
```

3. Define routes:
```python
@app.route("/hello/<name>")
def hello(name):
    return Response.text(f"Hello, {name}!")
```

4. Run the server:
```python
app.run(debug=True)
```

## Routing

Routes support path parameters:
```python
@app.route("/user/<id>")
def user_profile(id):
    return Response.json({"user_id": id})
```

## Templates

Register and render templates:
```python
from webapp_framework.templating.engine import TemplateEngine

engine = TemplateEngine()
engine.register_template("index", "<h1>{{ title }}</h1>")
html = engine.render("index", {"title": "Welcome"})
```
