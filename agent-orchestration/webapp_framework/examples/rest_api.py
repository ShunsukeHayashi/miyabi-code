"""REST API example."""
from webapp_framework.core.application import Application
from webapp_framework.core.response import Response

app = Application("RestAPI")

users = []

@app.route("/api/users", methods=["GET"])
def get_users():
    return Response.json(users)

@app.route("/api/users", methods=["POST"])
def create_user(request):
    data = request.get_json()
    users.append(data)
    return Response.json(data, status_code=201)

if __name__ == "__main__":
    app.run(debug=True)
