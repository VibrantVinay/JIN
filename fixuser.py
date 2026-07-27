# D:\Jinvexa\fix_users.py

"""
Fix MongoDB users collection - removes null user_id and creates proper indexes.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from Config.db_config import mongodb, get_collection
from Agents.AuthManager import AuthManager


def fix_users():
    """Fix users collection by removing null user_id and recreating indexes."""
    
    print("="*60)
    print("🔧 Fixing MongoDB Users Collection")
    print("="*60)
    
    if not mongodb.is_connected():
        print("❌ MongoDB not connected. Please check your connection.")
        return
    
    collection = get_collection("users")
    if collection is None:
        print("❌ Could not get users collection.")
        return
    
    print("\n📋 Current state:")
    total = collection.count_documents({})
    print(f"   Total documents: {total}")
    
    # Count documents with null or missing user_id
    null_count = collection.count_documents({"user_id": None})
    missing_count = collection.count_documents({"user_id": {"$exists": False}})
    print(f"   Documents with user_id: null: {null_count}")
    print(f"   Documents without user_id: {missing_count}")
    
    # Fix documents
    if null_count > 0 or missing_count > 0:
        print("\n🔄 Fixing documents...")
        
        # Get highest user_id
        max_doc = collection.find_one({}, sort=[("user_id", -1)])
        next_id = max_doc.get("user_id", 0) + 1 if max_doc else 1
        
        # Fix documents with null user_id
        if null_count > 0:
            cursor = collection.find({"user_id": None})
            for doc in cursor:
                collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"user_id": next_id}}
                )
                print(f"   ✅ Fixed: {doc.get('username', 'unknown')} → user_id: {next_id}")
                next_id += 1
        
        # Fix documents without user_id
        if missing_count > 0:
            cursor = collection.find({"user_id": {"$exists": False}})
            for doc in cursor:
                collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"user_id": next_id}}
                )
                print(f"   ✅ Fixed: {doc.get('username', 'unknown')} → user_id: {next_id}")
                next_id += 1
        
        print("\n✅ All documents fixed!")
    
    # Drop and recreate indexes
    print("\n🔄 Recreating indexes...")
    
    try:
        collection.drop_index("user_id_1")
        print("   Dropped user_id_1 index")
    except:
        print("   user_id_1 index not found")
    
    try:
        collection.drop_index("username_1")
        print("   Dropped username_1 index")
    except:
        print("   username_1 index not found")
    
    try:
        collection.create_index("username", unique=True)
        print("   ✅ Created username index")
    except Exception as e:
        print(f"   ❌ Failed to create username index: {e}")
    
    try:
        collection.create_index("user_id", unique=True)
        print("   ✅ Created user_id index")
    except Exception as e:
        print(f"   ❌ Failed to create user_id index: {e}")
    
    # Verify final state
    print("\n📋 Final state:")
    final_total = collection.count_documents({})
    final_null = collection.count_documents({"user_id": None})
    final_missing = collection.count_documents({"user_id": {"$exists": False}})
    print(f"   Total documents: {final_total}")
    print(f"   Documents with user_id: null: {final_null}")
    print(f"   Documents without user_id: {final_missing}")
    
    # List all users
    print("\n📋 Users:")
    cursor = collection.find({}, {"_id": 0, "user_id": 1, "username": 1})
    for doc in cursor:
        print(f"   user_id: {doc.get('user_id')} → username: {doc.get('username')}")
    
    print("\n" + "="*60)
    print("✅ Fix complete!")


if __name__ == "__main__":
    fix_users()