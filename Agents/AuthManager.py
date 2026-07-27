# D:\Jinvexa\Agents\AuthManager.py

import os
import hashlib
from typing import Optional, Dict, List, Any
from pathlib import Path
import json
from datetime import datetime

# Import MongoDB config
from Config.db_config import mongodb, get_collection


class AuthManager:
    """
    Manages user authentication using MongoDB.
    Users stored with: user_id (auto-increment), username (unique), password_hash.
    """
    
    def __init__(self):
        """Initialize AuthManager with MongoDB connection."""
        self._users: Dict[str, Dict] = {}  # username -> {user_id, username, password_hash}
        self._collection = None
        self._current_user_id = None
        
        # Try to connect to MongoDB
        if mongodb.is_connected():
            self._collection = get_collection("users")
            if self._collection is not None:
                print("✅ AuthManager: Connected to MongoDB users collection")
                self._ensure_indexes()
                self._load_users_from_db()
            else:
                print("⚠️ AuthManager: Could not get users collection")
                self._init_fallback()
        else:
            print("⚠️ AuthManager: MongoDB not connected. Using fallback.")
            self._init_fallback()
    
    def _ensure_indexes(self):
        """Ensure indexes on username and user_id."""
        if self._collection is None:
            return
        
        try:
            # Unique index on username
            self._collection.create_index("username", unique=True)
            # Unique index on user_id
            self._collection.create_index("user_id", unique=True)
            print("✅ AuthManager: Indexes created")
        except Exception as e:
            print(f"⚠️ AuthManager: Index creation error: {e}")
    
    def _get_next_user_id(self) -> int:
        """Get next user_id (auto-increment)."""
        if self._collection is None:
            return len(self._users) + 1
        
        try:
            # Find the highest user_id
            max_doc = self._collection.find_one(
                {},
                sort=[("user_id", -1)]
            )
            if max_doc and max_doc.get("user_id"):
                return max_doc["user_id"] + 1
            return 1
        except:
            return len(self._users) + 1
    
    def _init_fallback(self):
        """Initialize fallback in-memory storage."""
        self._fallback_users = {
            "admin": {"user_id": 1, "password_hash": self._hash_password("admin123")},
            "alice": {"user_id": 2, "password_hash": self._hash_password("alice123")},
            "bob": {"user_id": 3, "password_hash": self._hash_password("bob123")},
            "carol": {"user_id": 4, "password_hash": self._hash_password("carol123")},
            "testuser": {"user_id": 5, "password_hash": self._hash_password("test123")}
        }
        self._users = self._fallback_users.copy()
        print("✅ AuthManager: Using fallback in-memory users")
    
    def _load_users_from_db(self):
        """Load all users from MongoDB."""
        if self._collection is None:
            return
        
        try:
            # Check if users exist
            if self._collection.count_documents({}) == 0:
                self._create_default_users()
            
            # Load all users
            cursor = self._collection.find({})
            for doc in cursor:
                username = doc.get("username")
                user_id = doc.get("user_id")
                password_hash = doc.get("password_hash")
                if username and user_id and password_hash:
                    self._users[username] = {
                        "user_id": user_id,
                        "password_hash": password_hash,
                        "created_at": doc.get("created_at")
                    }
            
            print(f"✅ AuthManager: Loaded {len(self._users)} users from MongoDB")
        except Exception as e:
            print(f"⚠️ AuthManager: Error loading users from MongoDB: {e}")
            self._init_fallback()
    
    def _create_default_users(self):
        """Create default users in MongoDB."""
        if self._collection is None:
            return
        
        default_users = [
            ("admin", "admin123"),
            ("alice", "alice123"),
            ("bob", "bob123"),
            ("carol", "carol123"),
            ("testuser", "test123")
        ]
        
        try:
            for i, (username, password) in enumerate(default_users, 1):
                self._collection.insert_one({
                    "user_id": i,
                    "username": username,
                    "password_hash": self._hash_password(password),
                    "created_at": datetime.now().isoformat(),
                    "metadata": {}
                })
            print("✅ AuthManager: Created default users in MongoDB")
        except Exception as e:
            print(f"⚠️ AuthManager: Error creating default users: {e}")
    
    def _hash_password(self, password: str) -> str:
        """Hash password for storage."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def authenticate(self, username: str, password: str) -> Optional[int]:
        """
        Authenticate a user.
        
        Returns:
            user_id if successful, None otherwise
        """
        if not username or not password:
            return None
        
        # Check in MongoDB first
        if self._collection is not None:
            try:
                doc = self._collection.find_one({"username": username})
                if doc:
                    stored_hash = doc.get("password_hash")
                    if stored_hash and stored_hash == self._hash_password(password):
                        user_id = doc.get("user_id")
                        self._current_user_id = user_id
                        return user_id
            except Exception as e:
                print(f"⚠️ AuthManager: MongoDB auth error: {e}")
        
        # Fallback to in-memory
        user_data = self._users.get(username)
        if user_data and user_data.get("password_hash") == self._hash_password(password):
            self._current_user_id = user_data.get("user_id")
            return user_data.get("user_id")
        
        return None
    
    def get_user_id(self, username: str) -> Optional[int]:
        """Get user_id for a username."""
        if self._collection is not None:
            try:
                doc = self._collection.find_one({"username": username})
                if doc:
                    return doc.get("user_id")
            except:
                pass
        
        user_data = self._users.get(username)
        if user_data:
            return user_data.get("user_id")
        return None
    
    def get_username(self, user_id: int) -> Optional[str]:
        """Get username for a user_id."""
        if self._collection is not None:
            try:
                doc = self._collection.find_one({"user_id": user_id})
                if doc:
                    return doc.get("username")
            except:
                pass
        
        for username, data in self._users.items():
            if data.get("user_id") == user_id:
                return username
        return None
    
    def get_user(self, username: str) -> Optional[Dict]:
        """Get full user info."""
        if self._collection is not None:
            try:
                doc = self._collection.find_one(
                    {"username": username},
                    {"_id": 0, "password_hash": 0}
                )
                if doc:
                    return doc
            except:
                pass
        
        user_data = self._users.get(username)
        if user_data:
            return {
                "user_id": user_data.get("user_id"),
                "username": username
            }
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by user_id."""
        if self._collection is not None:
            try:
                doc = self._collection.find_one(
                    {"user_id": user_id},
                    {"_id": 0, "password_hash": 0}
                )
                if doc:
                    return doc
            except:
                pass
        
        for username, data in self._users.items():
            if data.get("user_id") == user_id:
                return {
                    "user_id": user_id,
                    "username": username
                }
        return None
    
    def list_users(self) -> List[Dict]:
        """List all registered users with their info."""
        users = []
        
        if self._collection is not None:
            try:
                cursor = self._collection.find({}, {"_id": 0, "password_hash": 0})
                for doc in cursor:
                    users.append(doc)
                return users
            except:
                pass
        
        for username, data in self._users.items():
            users.append({
                "user_id": data.get("user_id"),
                "username": username
            })
        
        return users
    
    def list_usernames(self) -> List[str]:
        """List all usernames."""
        users = self.list_users()
        return [u.get("username") for u in users if u.get("username")]
    
    def add_user(self, username: str, password: str) -> Optional[int]:
        """
        Add a new user.
        
        Returns:
            user_id if successful, None otherwise
        """
        if not username or not password:
            return None
        
        # Check if user exists
        if self.get_user(username):
            return None
        
        user_id = self._get_next_user_id()
        
        # Add to MongoDB
        if self._collection is not None:
            try:
                self._collection.insert_one({
                    "user_id": user_id,
                    "username": username,
                    "password_hash": self._hash_password(password),
                    "created_at": datetime.now().isoformat(),
                    "metadata": {}
                })
                self._users[username] = {
                    "user_id": user_id,
                    "password_hash": self._hash_password(password)
                }
                return user_id
            except Exception as e:
                print(f"⚠️ AuthManager: Error adding user: {e}")
                return None
        
        # Fallback to in-memory
        self._users[username] = {
            "user_id": user_id,
            "password_hash": self._hash_password(password)
        }
        return user_id
    
    def delete_user(self, username: str) -> bool:
        """Delete a user."""
        if not username:
            return False
        
        # Don't delete the last admin
        if username == "admin":
            users = self.list_usernames()
            if len(users) <= 1:
                print("⚠️ AuthManager: Cannot delete the last admin user")
                return False
        
        # Delete from MongoDB
        if self._collection is not None:
            try:
                result = self._collection.delete_one({"username": username})
                if result.deleted_count > 0:
                    if username in self._users:
                        del self._users[username]
                    return True
            except Exception as e:
                print(f"⚠️ AuthManager: Error deleting user: {e}")
                return False
        
        # Fallback to in-memory
        if username in self._users:
            del self._users[username]
            return True
        
        return False
    
    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Change a user's password."""
        if not username or not old_password or not new_password:
            return False
        
        # Verify old password
        if not self.authenticate(username, old_password):
            return False
        
        # Update password
        new_hash = self._hash_password(new_password)
        
        if self._collection is not None:
            try:
                result = self._collection.update_one(
                    {"username": username},
                    {"$set": {"password_hash": new_hash, "updated_at": datetime.now().isoformat()}}
                )
                if result.modified_count > 0:
                    if username in self._users:
                        self._users[username]["password_hash"] = new_hash
                    return True
            except Exception as e:
                print(f"⚠️ AuthManager: Error changing password: {e}")
                return False
        
        # Fallback to in-memory
        if username in self._users:
            self._users[username]["password_hash"] = new_hash
            return True
        
        return False
    
    def get_stats(self) -> Dict:
        """Get authentication statistics."""
        stats = {
            "total_users": len(self.list_usernames()),
            "mongodb_connected": self._collection is not None,
            "cache_size": len(self._users)
        }
        
        if self._collection is not None:
            try:
                stats["mongodb_users"] = self._collection.count_documents({})
            except:
                stats["mongodb_users"] = 0
        
        return stats


# ==================== SINGLETON INSTANCE ====================

auth_manager = AuthManager()


# ==================== CONVENIENCE FUNCTIONS ====================

def authenticate(username: str, password: str) -> Optional[int]:
    """Authenticate a user. Returns user_id if successful."""
    return auth_manager.authenticate(username, password)


def get_user_id(username: str) -> Optional[int]:
    """Get user_id for a username."""
    return auth_manager.get_user_id(username)


def get_username(user_id: int) -> Optional[str]:
    """Get username for a user_id."""
    return auth_manager.get_username(user_id)


def get_user(username: str) -> Optional[Dict]:
    """Get user info."""
    return auth_manager.get_user(username)


def list_users() -> List[Dict]:
    """List all users with their info."""
    return auth_manager.list_users()


def list_usernames() -> List[str]:
    """List all usernames."""
    return auth_manager.list_usernames()


def add_user(username: str, password: str) -> Optional[int]:
    """Add a new user. Returns user_id."""
    return auth_manager.add_user(username, password)


def delete_user(username: str) -> bool:
    """Delete a user."""
    return auth_manager.delete_user(username)


def change_password(username: str, old_password: str, new_password: str) -> bool:
    """Change a user's password."""
    return auth_manager.change_password(username, old_password, new_password)


def get_auth_stats() -> Dict:
    """Get authentication statistics."""
    return auth_manager.get_stats()


def sync_from_file(auth_file: str = ".testauth") -> int:
    """Sync users from .testauth file to MongoDB."""
    auth_path = Path(auth_file)
    if not auth_path.exists():
        print(f"⚠️ AuthManager: {auth_file} not found")
        return 0
    
    synced = 0
    try:
        with open(auth_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        username, password = parts[0].strip(), parts[1].strip()
                        if add_user(username, password):
                            synced += 1
        print(f"✅ AuthManager: Synced {synced} users from {auth_file}")
    except Exception as e:
        print(f"⚠️ AuthManager: Error syncing users: {e}")
    
    return synced