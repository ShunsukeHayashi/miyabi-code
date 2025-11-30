"""Full-featured application example."""
from webapp_framework.core.application import Application
from webapp_framework.core.response import Response
from webapp_framework.auth.authenticator import Authenticator

app = Application("FullApp")
auth = Authenticator()

@app.route("/")
def index():
    return Response.html("<h1>Welcome</h1>")

@app.route("/register", methods=["POST"])
def register(request):
    data = request.get_json()
    if auth.register(data["username"], data["password"]):
        return Response.json({"message": "Registered successfully"})
    return Response.json({"error": "User exists"}, status_code=400)

@app.route("/login", methods=["POST"])
def login(request):
    data = request.get_json()
    token = auth.login(data["username"], data["password"])
    if token:
        return Response.json({"token": token})
    return Response.json({"error": "Invalid credentials"}, status_code=401)

if __name__ == "__main__":
    app.run(debug=True)
