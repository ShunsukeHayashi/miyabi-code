"""Simple hello world webapp."""
from webapp_framework.core.application import Application
from webapp_framework.core.response import Response

app = Application("HelloWorld")

@app.route("/")
def index():
    return Response.html("<h1>Hello, World!</h1>")

@app.route("/json")
def json_endpoint():
    return Response.json({"message": "Hello, World!"})

if __name__ == "__main__":
    app.run(debug=True)
