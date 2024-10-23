from flask import Flask, jsonify, request
from pymongo import MongoClient
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['test_database']  # Replace 'your_database_name' with your actual database name
collection = db['test_collection']  # Assuming your collection name is 'test_collection'

# API endpoint to fetch all data
@app.route('/api/data', methods=['GET'])
def get_all_data():
    data = list(collection.find({}, {'_id': 0}))
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
