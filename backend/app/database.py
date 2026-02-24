from pymongo import MongoClient

# Connect to local MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Create / use database
db = client["phishshield_db"]

# Create / use collection
scan_collection = db["scan_history"]