from flask import Flask, jsonify, request

app = Flask(__name__)

users = []

@app.route("/")
def home():
    return "Hello, Backend!"

@app.route("/users", methods=["GET"])
def get_users():
    return jsonify(users)

@app.route("/users", methods=["POST"])
def add_user():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    user = {"id": len(users) + 1, "name": name}
    users.append(user)
    return jsonify(user), 201

if __name__ == "__main__":
    app.run(debug=True)
