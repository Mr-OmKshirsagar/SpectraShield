from pymongo import MongoClient, ASCENDING

# Connect to local MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Create / use database
db = client["phishshield_db"]

# Create / use collection
scan_collection = db["scan_history"]
scan_collection.create_index([("thread_id", ASCENDING)])

# Threat intelligence feed (OpenPhish) – URL is unique key
threat_feed_collection = db["threat_feed"]
threat_feed_collection.create_index([("url", ASCENDING)], unique=True)

# VirusTotal URL intelligence cache (24h)
vt_cache_collection = db["vt_url_cache"]
vt_cache_collection.create_index([("url", ASCENDING)], unique=True)