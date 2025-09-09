from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

cred = credentials.Certificate("../key/noted-11d5b-firebase-adminsdk-fbsvc-0f0b31050b.json")
firebase_admin.initialize_app(cred)

@app.route('/get-uid', methods=['POST'])
def get_uid():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        user_record = auth.get_user_by_email(email)
        return jsonify({"uid": user_record.uid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=3001, debug=True)
