# D:\Jinvexa\Config\db_config.py

import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import logging
from typing import Optional, Dict, Any, List

# Load environment variables
load_dotenv()


class MongoDBConfig:
    """
    MongoDB Configuration and Connection Manager.
    Singleton pattern to ensure single connection instance.
    Handles authentication errors gracefully with fallback to JSON.
    """
    
    _instance = None
    _client = None
    _db = None
    _connected = False
    _connection_error = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConfig, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize MongoDB connection."""
        if self._client is None and not self._connected:
            self._connect()
    
    def _connect(self):
        """Establish MongoDB connection with graceful error handling."""
        try:
            # Get credentials from environment
            db_user = os.getenv("DB_USER", "echelonglobaltech_db_user")
            db_password = os.getenv("DB_PASSWORD")
            db_cluster = os.getenv("DB_CLUSTER", "jinvexa.5qfbxth.mongodb.net")
            db_app_name = os.getenv("DB_APP_NAME", "Jinvexa")
            
            # Check if password is set
            if not db_password:
                self._connection_error = "DB_PASSWORD not set in .env file"
                self._connected = False
                print(f"⚠️ MongoDB: {self._connection_error}")
                print("   Using JSON storage fallback.")
                return
            
            if db_password == "your_password_here" or db_password == "your_actual_password_here":
                self._connection_error = "DB_PASSWORD not configured (using placeholder)"
                self._connected = False
                print(f"⚠️ MongoDB: {self._connection_error}")
                print("   Please set your actual MongoDB password in .env")
                print("   Using JSON storage fallback.")
                return
            
            # Build connection URI
            uri = f"mongodb+srv://{db_user}:{db_password}@{db_cluster}/?appName={db_app_name}"
            
            # Create client with timeout
            self._client = MongoClient(uri, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)
            
            # Ping to confirm connection
            self._client.admin.command('ping')
            
            # Get database - store as object
            self._db = self._client.get_database("jinvexa")
            
            self._connected = True
            self._connection_error = None
            
            print("✅ MongoDB: Successfully connected to MongoDB Atlas!")
            
            # Create indexes
            self._create_indexes()
            
        except Exception as e:
            self._connected = False
            self._connection_error = str(e)
            print(f"⚠️ MongoDB: Connection failed - {e}")
            print("   Using JSON storage fallback.")
            print("   To use MongoDB, ensure:")
            print("   1. STORAGE_TYPE=mongodb in .env")
            print("   2. DB_PASSWORD is set correctly in .env")
            print("   3. Network allows connection to MongoDB Atlas")
    
    def _create_indexes(self):
        """Create necessary indexes for performance."""
        # Check if connected and database exists using is not None
        if not self._connected or self._db is None:
            return
        
        try:
            # Users collection indexes
            self._db.users.create_index("username", unique=True)
            self._db.users.create_index("email")
            
            # Sessions collection indexes
            self._db.sessions.create_index("session_id", unique=True)
            self._db.sessions.create_index("user_id")
            self._db.sessions.create_index("created_at")
            
            # Lessons collection indexes
            self._db.lessons.create_index("session_id")
            self._db.lessons.create_index("topic")
            
            # Assignments collection indexes
            self._db.assignments.create_index("assignment_id", unique=True)
            self._db.assignments.create_index("user_id")
            self._db.assignments.create_index("session_id")
            
            # Results collection indexes
            self._db.results.create_index("assignment_id")
            self._db.results.create_index("user_id")
            
            # Progress collection indexes
            self._db.progress.create_index("user_id", unique=True)
            
            # Mentoring collections indexes
            self._db.mentoring_conversations.create_index("user_id")
            self._db.mentoring_conversations.create_index("session_id")
            self._db.mentoring_messages.create_index("conversation_id")
            self._db.mentoring_messages.create_index("created_at")
            
            # Knowledge graph indexes
            self._db.knowledge_graph.create_index("session_id")
            self._db.knowledge_graph.create_index("concept_id")
            
            # User activity indexes
            self._db.user_activity.create_index("user_id")
            self._db.user_activity.create_index("created_at")
            
            print("✅ MongoDB: Indexes created successfully")
            
        except Exception as e:
            print(f"⚠️ MongoDB: Index creation warning - {e}")
    
    @property
    def client(self) -> Optional[MongoClient]:
        """Get MongoDB client."""
        return self._client if self._connected else None
    
    @property
    def db(self):
        """Get MongoDB database instance."""
        # Check using is not None
        if self._connected and self._db is not None:
            return self._db
        return None
    
    def get_collection(self, collection_name: str):
        """Get a collection by name."""
        if self._connected and self._db is not None:
            return self._db[collection_name]
        return None
    
    def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._connected = False
            print("MongoDB: Connection closed")
    
    def is_connected(self) -> bool:
        """Check if connection is active."""
        return self._connected
    
    def get_connection_error(self) -> Optional[str]:
        """Get the last connection error."""
        return self._connection_error
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get connection information."""
        collections = []
        # Check using is not None
        if self._connected and self._db is not None:
            try:
                collections = self._db.list_collection_names()
            except:
                pass
        
        return {
            "connected": self._connected,
            "database": "jinvexa" if self._connected else None,
            "collections": collections if self._connected else [],
            "error": self._connection_error
        }
    
    def get_collection_names(self) -> List[str]:
        """Get list of collection names."""
        # Check using is not None
        if self._connected and self._db is not None:
            try:
                return self._db.list_collection_names()
            except:
                pass
        return []
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        if not self._connected or self._db is None:
            return {"error": "Not connected"}
        
        try:
            stats = {}
            for name in self.get_collection_names():
                collection = self._db[name]
                stats[name] = collection.count_documents({})
            return stats
        except:
            return {"error": "Could not get stats"}


# ==================== SINGLETON INSTANCE ====================

# Create singleton instance
mongodb = MongoDBConfig()


# ==================== CONVENIENCE FUNCTIONS ====================

def get_db():
    """Get database instance."""
    if mongodb.is_connected() and mongodb.db is not None:
        return mongodb.db
    return None


def get_collection(name: str):
    """Get a collection."""
    return mongodb.get_collection(name)


def is_mongodb_available() -> bool:
    """Check if MongoDB is available."""
    return mongodb.is_connected()


def close_connection():
    """Close MongoDB connection."""
    mongodb.close()


def get_connection_status() -> Dict[str, Any]:
    """Get connection status."""
    return mongodb.get_connection_info()


# ==================== TEST FUNCTION ====================

def test_connection():
    """Test MongoDB connection and print status."""
    print("\n" + "="*60)
    print("📊 MongoDB Connection Test")
    print("="*60)
    
    status = get_connection_status()
    
    if status["connected"]:
        print("✅ Status: CONNECTED")
        print(f"   Database: {status['database']}")
        print(f"   Collections: {', '.join(status['collections']) if status['collections'] else 'None'}")
        print("\n📋 Collection Stats:")
        stats = mongodb.get_stats()
        if stats and "error" not in stats:
            for name, count in stats.items():
                print(f"   - {name}: {count} documents")
        else:
            print("   Unable to get stats")
    else:
        print("❌ Status: NOT CONNECTED")
        if status["error"]:
            print(f"   Error: {status['error']}")
        print("\n💡 To fix:")
        print("   1. Set STORAGE_TYPE=mongodb in .env")
        print("   2. Set DB_PASSWORD in .env")
        print("   3. Ensure network allows connection")
        print("   4. Or use STORAGE_TYPE=json for local storage")
    
    print("="*60 + "\n")
    return status["connected"]


# ==================== MAIN (for testing) ====================

if __name__ == "__main__":
    # Run connection test
    test_connection()