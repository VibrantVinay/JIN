# D:\Jinvexa\Agents\MemoryHandler.py

import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import hashlib
import pickle
from dataclasses import dataclass, asdict, field

from Models.UserProfile import UserProfile
from Models.LearningPlan import LearningPlan

# Try to import MongoDB config (optional)
try:
    from Config.db_config import mongodb, get_collection
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("⚠️ MongoDB not available. Install pymongo and configure db_config.py")


@dataclass
class SessionMemory:
    """Represents a complete session memory"""
    session_id: str
    user_id: str
    mode: str  # "goal" or "reference"
    created_at: str
    last_accessed: str
    conversation_history: List[Dict]
    extracted_data: Optional[Dict] = None
    concepts: Optional[Dict] = None
    knowledge_graph: Optional[Dict] = None
    gap_analysis: Optional[Dict] = None
    learning_plan: Optional[Dict] = None
    user_profile: Optional[Dict] = None
    metadata: Dict = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "mode": self.mode,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
            "conversation_history": self.conversation_history,
            "extracted_data": self.extracted_data,
            "concepts": self.concepts,
            "knowledge_graph": self.knowledge_graph,
            "gap_analysis": self.gap_analysis,
            "learning_plan": self.learning_plan,
            "user_profile": self.user_profile,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "SessionMemory":
        return cls(**data)


class MemoryHandler:
    """
    Handles persistent memory storage for the Learning Discovery Agent.
    Supports: JSON (default), MongoDB, SQLite
    """
    
    def __init__(self, storage_dir: str = "memory_storage", storage_type: str = "json"):
        """
        Initialize the Memory Handler
        
        Args:
            storage_dir: Directory for storing memory files (JSON only)
            storage_type: "json" (default), "mongodb", "sqlite"
        """
        self.storage_dir = Path(storage_dir)
        self.storage_type = storage_type
        
        # In-memory cache for fast access
        self._cache: Dict[str, SessionMemory] = {}
        self._profile_cache: Dict[str, UserProfile] = {}
        
        # Initialize storage based on type
        if storage_type == "json":
            self._init_json_storage()
        elif storage_type == "mongodb":
            self._init_mongodb_storage()
        elif storage_type == "sqlite":
            self._init_sqlite_storage()
        else:
            raise ValueError(f"Unsupported storage type: {storage_type}")
        
        print(f"💾 MemoryHandler initialized (Storage: {storage_type.upper()})")
    
    # ==================== INITIALIZATION ====================
    
    def _init_json_storage(self):
        """Initialize JSON storage directories."""
        self.storage_dir.mkdir(exist_ok=True)
        (self.storage_dir / "sessions").mkdir(exist_ok=True)
        (self.storage_dir / "profiles").mkdir(exist_ok=True)
        (self.storage_dir / "assignments").mkdir(exist_ok=True)
        (self.storage_dir / "progress").mkdir(exist_ok=True)
    
    def _init_mongodb_storage(self):
        """Initialize MongoDB collections."""
        if not MONGODB_AVAILABLE:
            print("⚠️ MongoDB not available. Falling back to JSON storage.")
            self.storage_type = "json"
            self._init_json_storage()
            return
        
        if not mongodb.is_connected():
            print("⚠️ MongoDB not connected. Falling back to JSON storage.")
            self.storage_type = "json"
            self._init_json_storage()
            return
        
        # Collections will be created on first write
        self._collections = {
            "sessions": get_collection("sessions"),
            "profiles": get_collection("profiles"),
            "lessons": get_collection("lessons"),
            "audio": get_collection("audio"),
            "manifests": get_collection("manifests"),
            "assignments": get_collection("assignments"),
            "results": get_collection("results"),
            "progress": get_collection("progress"),
            "mentoring_conversations": get_collection("mentoring_conversations"),
            "mentoring_messages": get_collection("mentoring_messages"),
            "knowledge_graph": get_collection("knowledge_graph"),
            "dependencies": get_collection("dependencies"),
            "user_activity": get_collection("user_activity")
        }
        print("✅ MongoDB collections ready")
    
    def _init_sqlite_storage(self):
        """Initialize SQLite storage (for mentoring)."""
        # SQLite is already handled in mentoring methods
        pass
    
    def _get_collection(self, name: str):
        """Get MongoDB collection."""
        if self.storage_type == "mongodb" and hasattr(self, '_collections'):
            return self._collections.get(name)
        return None
    
    # ==================== SESSION MANAGEMENT ====================
    
    def create_session(
        self,
        user_id: str,
        mode: str,
        user_profile: Optional[UserProfile] = None
    ) -> str:
        """
        Create a new session
        
        Returns:
            session_id: Unique session identifier
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        hash_suffix = hashlib.md5(f"{user_id}{datetime.now()}".encode()).hexdigest()[:8]
        session_id = f"{user_id}_{timestamp}_{hash_suffix}"
        
        session = SessionMemory(
            session_id=session_id,
            user_id=user_id,
            mode=mode,
            created_at=datetime.now().isoformat(),
            last_accessed=datetime.now().isoformat(),
            conversation_history=[],
            user_profile=user_profile.to_dict() if user_profile else None
        )
        
        # Save to cache
        self._cache[session_id] = session
        
        # Save to storage
        if self.storage_type == "json":
            self._save_session_json(session)
        elif self.storage_type == "mongodb":
            self._save_session_mongodb(session)
        
        print(f"✅ Session created: {session_id[:20]}...")
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[SessionMemory]:
        """Get a session by ID"""
        # Check cache first
        if session_id in self._cache:
            return self._cache[session_id]
        
        # Check storage
        if self.storage_type == "json":
            session = self._load_session_json(session_id)
        elif self.storage_type == "mongodb":
            session = self._load_session_mongodb(session_id)
        else:
            session = None
        
        if session:
            self._cache[session_id] = session
        return session
    
    def update_session(self, session: SessionMemory):
        """Update an existing session"""
        session.last_accessed = datetime.now().isoformat()
        
        # Update cache
        self._cache[session.session_id] = session
        
        # Update storage
        if self.storage_type == "json":
            self._save_session_json(session)
        elif self.storage_type == "mongodb":
            self._save_session_mongodb(session)
    
    def delete_session(self, session_id: str):
        """Delete a session"""
        # Remove from cache
        if session_id in self._cache:
            del self._cache[session_id]
        
        # Remove from storage
        if self.storage_type == "json":
            self._delete_session_json(session_id)
        elif self.storage_type == "mongodb":
            self._delete_session_mongodb(session_id)
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[SessionMemory]:
        """Get all sessions for a user"""
        if self.storage_type == "json":
            return self._get_user_sessions_json(user_id, limit)
        elif self.storage_type == "mongodb":
            return self._get_user_sessions_mongodb(user_id, limit)
        return []
    
    def add_conversation_message(self, session_id: str, role: str, message: str):
        """Add a message to session conversation history"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.conversation_history.append({
            "role": role,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        self.update_session(session)
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        session = self.get_session(session_id)
        return session.conversation_history if session else []
    
    def clear_conversation_history(self, session_id: str):
        """Clear conversation history for a session"""
        session = self.get_session(session_id)
        if session:
            session.conversation_history = []
            self.update_session(session)
    
    # ==================== PROFILE MANAGEMENT ====================
    
    def save_profile(self, profile: UserProfile):
        """Save a user profile"""
        # Save to cache
        self._profile_cache[profile.user_id] = profile
        
        # Save to storage
        if self.storage_type == "json":
            self._save_profile_json(profile)
        elif self.storage_type == "mongodb":
            self._save_profile_mongodb(profile)
    
    def load_profile(self, user_id: str) -> Optional[UserProfile]:
        """Load a user profile"""
        # Check cache first
        if user_id in self._profile_cache:
            return self._profile_cache[user_id]
        
        # Check storage
        if self.storage_type == "json":
            profile = self._load_profile_json(user_id)
        elif self.storage_type == "mongodb":
            profile = self._load_profile_mongodb(user_id)
        else:
            profile = None
        
        if profile:
            self._profile_cache[user_id] = profile
        return profile
    
    def delete_profile(self, user_id: str):
        """Delete a user profile"""
        # Remove from cache
        if user_id in self._profile_cache:
            del self._profile_cache[user_id]
        
        # Remove from storage
        if self.storage_type == "json":
            self._delete_profile_json(user_id)
        elif self.storage_type == "mongodb":
            self._delete_profile_mongodb(user_id)
    
    def list_profiles(self) -> List[str]:
        """List all user IDs with profiles"""
        if self.storage_type == "json":
            profile_dir = self.storage_dir / "profiles"
            if profile_dir.exists():
                return [f.stem for f in profile_dir.glob("*.json")]
        elif self.storage_type == "mongodb":
            collection = self._get_collection("profiles")
            if collection is not None:
                return collection.distinct("user_id")
        return []
    
    # ==================== STATISTICS AND METRICS ====================
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get learning statistics for a user"""
        sessions = self.get_user_sessions(user_id, limit=100)
        
        stats = {
            "user_id": user_id,
            "total_sessions": len(sessions),
            "active_sessions": len([s for s in sessions if s.learning_plan]),
            "total_conversations": sum(len(s.conversation_history) for s in sessions),
            "learning_plans": [],
            "knowledge_progress": {}
        }
        
        # Collect learning plans
        for session in sessions:
            if session.learning_plan:
                plan = session.learning_plan
                stats["learning_plans"].append({
                    "topic": plan.get("main_topic", "Unknown"),
                    "goal": plan.get("goal", "Unknown"),
                    "estimated_hours": plan.get("estimated_time_hours", 0)
                })
        
        # Get knowledge progress from profile
        profile = self.load_profile(user_id)
        if profile:
            stats["knowledge_progress"] = {
                "known_concepts": len(profile.known_concepts),
                "topics": list(profile.known_concepts.keys())[:20]
            }
        
        return stats
    
    def get_global_stats(self) -> Dict[str, Any]:
        """Get global statistics across all users"""
        profiles = self.list_profiles()
        
        stats = {
            "total_users": len(profiles),
            "total_sessions": 0,
            "total_conversations": 0,
            "learning_plans_generated": 0
        }
        
        if self.storage_type == "json":
            session_dir = self.storage_dir / "sessions"
            if session_dir.exists():
                stats["total_sessions"] = len(list(session_dir.glob("*.json")))
                stats["total_conversations"] = stats["total_sessions"] * 5
        elif self.storage_type == "mongodb":
            collection = self._get_collection("sessions")
            if collection is not None:
                stats["total_sessions"] = collection.count_documents({})
                stats["total_conversations"] = stats["total_sessions"] * 5
        
        return stats
    
    # ==================== JSON BACKEND METHODS ====================
    
    def _save_session_json(self, session: SessionMemory):
        """Save session to JSON storage"""
        data = session.to_dict()
        
        # Convert complex objects to JSON strings for storage
        for key in ["conversation_history", "extracted_data", "concepts", 
                    "knowledge_graph", "gap_analysis", "learning_plan", 
                    "user_profile", "metadata"]:
            if data.get(key) is not None:
                try:
                    data[key] = json.dumps(data[key], ensure_ascii=False)
                except:
                    data[key] = None
            else:
                data[key] = None
        
        # Save to file
        session_file = self.storage_dir / "sessions" / f"{session.session_id}.json"
        with open(session_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _load_session_json(self, session_id: str) -> Optional[SessionMemory]:
        """Load session from JSON storage"""
        session_file = self.storage_dir / "sessions" / f"{session_id}.json"
        if session_file.exists():
            try:
                with open(session_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Parse JSON strings back to objects
                data = self._parse_session_data(data)
                
                return SessionMemory.from_dict(data)
            except Exception as e:
                print(f"⚠️ Error loading session {session_id}: {e}")
        
        return None
    
    def _delete_session_json(self, session_id: str):
        """Delete session from JSON storage"""
        session_file = self.storage_dir / "sessions" / f"{session_id}.json"
        if session_file.exists():
            session_file.unlink()
    
    def _get_user_sessions_json(self, user_id: str, limit: int = 10) -> List[SessionMemory]:
        """Get user sessions from JSON storage"""
        sessions = []
        session_dir = self.storage_dir / "sessions"
        
        if session_dir.exists():
            for file_path in session_dir.glob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    if data.get("user_id") == user_id:
                        parsed_data = self._parse_session_data(data)
                        session = SessionMemory.from_dict(parsed_data)
                        sessions.append(session)
                except Exception as e:
                    print(f"⚠️ Error loading session {file_path}: {e}")
                    continue
        
        sessions.sort(key=lambda x: x.created_at, reverse=True)
        return sessions[:limit]
    
    def _save_profile_json(self, profile: UserProfile):
        """Save profile to JSON storage"""
        data = {
            "user_id": profile.user_id,
            "profile_data": profile.to_dict(),
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }
        
        profile_file = self.storage_dir / "profiles" / f"{profile.user_id}.json"
        with open(profile_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _load_profile_json(self, user_id: str) -> Optional[UserProfile]:
        """Load profile from JSON storage"""
        profile_file = self.storage_dir / "profiles" / f"{user_id}.json"
        if profile_file.exists():
            try:
                with open(profile_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return UserProfile.from_dict(data.get("profile_data", {}))
            except Exception as e:
                print(f"⚠️ Error loading profile {user_id}: {e}")
        return None
    
    def _delete_profile_json(self, user_id: str):
        """Delete profile from JSON storage"""
        profile_file = self.storage_dir / "profiles" / f"{user_id}.json"
        if profile_file.exists():
            profile_file.unlink()
    
    def _parse_session_data(self, data: Dict) -> Dict:
        """Parse session data, converting JSON strings back to objects"""
        parsed = data.copy()
        
        json_keys = ["conversation_history", "extracted_data", "concepts", 
                     "knowledge_graph", "gap_analysis", "learning_plan", 
                     "user_profile", "metadata"]
        
        for key in json_keys:
            if key in parsed and parsed[key] is not None and isinstance(parsed[key], str):
                try:
                    parsed[key] = json.loads(parsed[key])
                except:
                    parsed[key] = None
            elif key in parsed and parsed[key] is None:
                parsed[key] = None
        
        return parsed
    
    # ==================== MONGODB BACKEND METHODS ====================
    
    def _save_session_mongodb(self, session: SessionMemory):
        """Save session to MongoDB"""
        collection = self._get_collection("sessions")
        if collection is None:
            print("⚠️ MongoDB collection not available")
            return
        
        data = session.to_dict()
        collection.update_one(
            {"session_id": session.session_id},
            {"$set": data},
            upsert=True
        )
    
    def _load_session_mongodb(self, session_id: str) -> Optional[SessionMemory]:
        """Load session from MongoDB"""
        collection = self._get_collection("sessions")
        if collection is None:
            return None
        
        data = collection.find_one({"session_id": session_id})
        if data:
            if "_id" in data:
                del data["_id"]
            return SessionMemory.from_dict(data)
        return None
    
    def _delete_session_mongodb(self, session_id: str):
        """Delete session from MongoDB"""
        collection = self._get_collection("sessions")
        if collection is not None:
            collection.delete_one({"session_id": session_id})
    
    def _get_user_sessions_mongodb(self, user_id: str, limit: int = 10) -> List[SessionMemory]:
        """Get user sessions from MongoDB"""
        collection = self._get_collection("sessions")
        if collection is None:
            return []
        
        sessions = []
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        for data in cursor:
            if "_id" in data:
                del data["_id"]
            sessions.append(SessionMemory.from_dict(data))
        return sessions
    
    def _save_profile_mongodb(self, profile: UserProfile):
        """Save profile to MongoDB"""
        collection = self._get_collection("profiles")
        if collection is None:
            print("⚠️ MongoDB collection not available")
            return
        
        data = {
            "user_id": profile.user_id,
            "profile_data": profile.to_dict(),
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }
        collection.update_one(
            {"user_id": profile.user_id},
            {"$set": data},
            upsert=True
        )
    
    def _load_profile_mongodb(self, user_id: str) -> Optional[UserProfile]:
        """Load profile from MongoDB"""
        collection = self._get_collection("profiles")
        if collection is None:
            return None
        
        data = collection.find_one({"user_id": user_id})
        if data:
            return UserProfile.from_dict(data.get("profile_data", {}))
        return None
    
    def _delete_profile_mongodb(self, user_id: str):
        """Delete profile from MongoDB"""
        collection = self._get_collection("profiles")
        if collection is not None:
            collection.delete_one({"user_id": user_id})
    
    # ==================== UTILITY METHODS ====================
    
    def clear_cache(self):
        """Clear in-memory cache"""
        self._cache.clear()
        self._profile_cache.clear()
    
    def cleanup_old_sessions(self, days: int = 30):
        """Delete sessions older than specified days"""
        cutoff = datetime.now() - timedelta(days=days)
        
        if self.storage_type == "json":
            session_dir = self.storage_dir / "sessions"
            if session_dir.exists():
                for file_path in session_dir.glob("*.json"):
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        created_at = datetime.fromisoformat(data.get("created_at", ""))
                        if created_at < cutoff:
                            file_path.unlink()
                    except:
                        continue
        elif self.storage_type == "mongodb":
            collection = self._get_collection("sessions")
            if collection is not None:
                collection.delete_many({
                    "created_at": {"$lt": cutoff.isoformat()}
                })
    
    # ==================== LESSON MANAGEMENT (TeachingAgent) ====================
    
    def save_lesson(self, session_id: str, topic: str, phase_title: str, lesson_text: str) -> str:
        """
        Save a lesson.
        If storage_type == "mongodb", stores only in MongoDB.
        If storage_type == "json", stores as a file.
        """
        from datetime import datetime
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("lessons")
            if collection is not None:
                doc = {
                    "session_id": session_id,
                    "topic": topic,
                    "phase_title": phase_title,
                    "content": lesson_text,
                    "file_path": None,
                    "file_size": len(lesson_text),
                    "created_at": datetime.now().isoformat(),
                    "metadata": {}
                }
                result = collection.insert_one(doc)
                return str(result.inserted_id)
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
                return self._save_lesson_json(session_id, topic, phase_title, lesson_text)
        
        # JSON storage
        return self._save_lesson_json(session_id, topic, phase_title, lesson_text)
    
    def _save_lesson_json(self, session_id: str, topic: str, phase_title: str, lesson_text: str) -> str:
        """Internal: save lesson as JSON file."""
        import re
        from datetime import datetime
        from pathlib import Path
        
        safe_topic = re.sub(r'[^\w\s-]', '', topic).strip().replace(' ', '_')
        safe_topic = re.sub(r'[-\s]+', '_', safe_topic)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{session_id}_{timestamp}_{safe_topic}.txt"
        filepath = Path("learn_files/lessons") / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"Session ID: {session_id}\n")
            f.write(f"Topic: {topic}\n")
            f.write(f"Phase: {phase_title}\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write("="*60 + "\n\n")
            f.write(lesson_text)
        
        return str(filepath)
    
    def get_lesson_content(self, lesson_file: str) -> str:
        """Read lesson content from file."""
        from pathlib import Path
        try:
            filepath = Path(lesson_file)
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    return f.read()
        except:
            pass
        return ""
    
    def save_manifest(self, session_id: str, manifest: list, main_topic: str):
        """
        Save manifest.
        If storage_type == "mongodb", stores only in MongoDB.
        If storage_type == "json", saves as JSON and TXT files.
        """
        from datetime import datetime
        
        manifest_data = {
            "session_id": session_id,
            "main_topic": main_topic,
            "generated_at": datetime.now().isoformat(),
            "total_lessons": len(manifest),
            "watch_order": manifest
        }
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("manifests")
            if collection is not None:
                collection.update_one(
                    {"session_id": session_id},
                    {"$set": manifest_data},
                    upsert=True
                )
                return
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        self._save_manifest_json(session_id, manifest, main_topic)
    
    def _save_manifest_json(self, session_id: str, manifest: list, main_topic: str):
        """Internal: save manifest as JSON files."""
        import json
        from datetime import datetime
        from pathlib import Path
        
        manifest_dir = Path("learn_files/manifests")
        manifest_dir.mkdir(parents=True, exist_ok=True)
        
        manifest_data = {
            "session_id": session_id,
            "main_topic": main_topic,
            "generated_at": datetime.now().isoformat(),
            "total_lessons": len(manifest),
            "watch_order": manifest
        }
        
        manifest_file = manifest_dir / f"{session_id}_manifest.json"
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        # Also human-readable version
        readable_file = manifest_dir / f"{session_id}_watch_order.txt"
        with open(readable_file, 'w', encoding='utf-8') as f:
            f.write(f"Course: {main_topic}\n")
            f.write(f"Session: {session_id}\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n")
            f.write("="*60 + "\n\n")
            f.write("📚 WATCH ORDER\n\n")
            for item in manifest:
                order = item.get("order", 0)
                phase = item.get("phase", "")
                topic = item.get("topic", "")
                content_type = item.get("content_type", "text")
                gender = item.get("gender", "")
                icon = f"🎧 ({gender})" if content_type == "audio" else "📄"
                f.write(f"{order}. {icon} {topic}\n")
                f.write(f"   Phase: {phase}\n")
                f.write(f"   Type: {content_type.upper()}\n\n")
    
    def get_manifest(self, session_id: str) -> dict:
        """Get manifest data for a session."""
        import json
        from pathlib import Path
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("manifests")
            if collection is not None:
                data = collection.find_one({"session_id": session_id})
                if data:
                    if "_id" in data:
                        del data["_id"]
                    return data
        
        # Fallback to JSON
        manifest_file = Path(f"learn_files/manifests/{session_id}_manifest.json")
        if manifest_file.exists():
            try:
                with open(manifest_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def save_audio_metadata(self, session_id: str, topic: str, audio_file: str, gender: str):
        """Save audio metadata. If MongoDB, store in MongoDB only."""
        from datetime import datetime
        
        doc = {
            "session_id": session_id,
            "topic": topic,
            "gender": gender,
            "file_path": audio_file,
            "created_at": datetime.now().isoformat()
        }
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("audio")
            if collection is not None:
                collection.insert_one(doc)
                return
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        self._save_audio_metadata_json(session_id, topic, audio_file, gender)
    
    def _save_audio_metadata_json(self, session_id: str, topic: str, audio_file: str, gender: str):
        """Internal: save audio metadata as JSON file."""
        import json
        from datetime import datetime
        from pathlib import Path
        
        audio_dir = Path("learn_files/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)
        audio_metadata_file = audio_dir / f"{session_id}_audio_metadata.json"
        
        existing = {}
        if audio_metadata_file.exists():
            try:
                with open(audio_metadata_file, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except:
                pass
        
        if session_id not in existing:
            existing[session_id] = []
        
        existing[session_id].append({
            "topic": topic,
            "generated_at": datetime.now().isoformat(),
            "gender": gender,
            "file": audio_file
        })
        
        with open(audio_metadata_file, 'w', encoding='utf-8') as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
    
    def save_course_metadata(self, session_id: str, course_content: dict):
        """Save course metadata. If MongoDB, store in MongoDB only."""
        if self.storage_type == "mongodb":
            collection = self._get_collection("course_metadata")
            if collection is not None:
                collection.update_one(
                    {"session_id": session_id},
                    {"$set": course_content},
                    upsert=True
                )
                return
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        self._save_course_metadata_json(session_id, course_content)
    
    def _save_course_metadata_json(self, session_id: str, course_content: dict):
        """Internal: save course metadata as JSON file."""
        import json
        from pathlib import Path
        
        lessons_dir = Path("learn_files/lessons")
        lessons_dir.mkdir(parents=True, exist_ok=True)
        course_metadata_file = lessons_dir / f"{session_id}_course_metadata.json"
        
        with open(course_metadata_file, 'w', encoding='utf-8') as f:
            json.dump(course_content, f, indent=2, ensure_ascii=False)
    
    # ==================== LIST SESSIONS WITH PLANS ====================
    
    def list_sessions_with_plans(self) -> list:
        """
        List all sessions that have learning plans.
        If using MongoDB, queries the sessions collection; otherwise falls back to JSON.
        """
        import json
        from pathlib import Path

        sessions = []

        # --- Query MongoDB if available ---
        if self.storage_type == "mongodb":
            collection = self._get_collection("sessions")
            if collection is not None:
                try:
                    cursor = collection.find({"learning_plan": {"$exists": True, "$ne": None}})
                    for data in cursor:
                        if "_id" in data:
                            del data["_id"]
                        learning_plan = data.get('learning_plan')
                        if isinstance(learning_plan, str):
                            try:
                                learning_plan = json.loads(learning_plan)
                            except:
                                continue
                        if learning_plan and isinstance(learning_plan, dict):
                            sessions.append({
                                "session_id": data.get('session_id', ''),
                                "user_id": data.get('user_id', ''),
                                "mode": data.get('mode', ''),
                                "created_at": data.get('created_at', ''),
                                "main_topic": learning_plan.get('main_topic', 'Unknown'),
                                "goal": learning_plan.get('goal', ''),
                                "total_hours": learning_plan.get('estimated_time_hours', 0),
                                "phase_count": len(learning_plan.get('roadmap', [])),
                                "learning_plan": learning_plan
                            })
                    return sessions
                except Exception as e:
                    print(f"⚠️ MongoDB query error in list_sessions_with_plans: {e}")

        # --- Fallback to JSON storage ---
        session_dir = self.storage_dir / "sessions"
        if session_dir.exists():
            for file_path in session_dir.glob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    learning_plan = data.get('learning_plan')
                    if isinstance(learning_plan, str):
                        try:
                            learning_plan = json.loads(learning_plan)
                        except:
                            pass
                    if learning_plan and isinstance(learning_plan, dict):
                        sessions.append({
                            "session_id": data.get('session_id', ''),
                            "user_id": data.get('user_id', ''),
                            "mode": data.get('mode', ''),
                            "created_at": data.get('created_at', ''),
                            "main_topic": learning_plan.get('main_topic', 'Unknown'),
                            "goal": learning_plan.get('goal', ''),
                            "total_hours": learning_plan.get('estimated_time_hours', 0),
                            "phase_count": len(learning_plan.get('roadmap', [])),
                            "learning_plan": learning_plan
                        })
                except Exception as e:
                    print(f"⚠️ Error loading session from JSON: {e}")

        return sessions
    
    # ==================== ASSIGNMENT MANAGEMENT ====================
    
    def save_assignment(self, assignment: dict) -> str:
        """
        Save assignment.
        If MongoDB: store in assignments collection.
        If JSON: save as JSON file.
        """
        import json
        from datetime import datetime
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("assignments")
            if collection is not None:
                assignment_id = assignment.get("assignment_id")
                if not assignment_id:
                    assignment_id = f"assign_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    assignment["assignment_id"] = assignment_id
                collection.update_one(
                    {"assignment_id": assignment_id},
                    {"$set": assignment},
                    upsert=True
                )
                return assignment_id
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        return self._save_assignment_json(assignment)
    
    def _save_assignment_json(self, assignment: dict) -> str:
        """Internal: save assignment as JSON file."""
        import json
        from pathlib import Path
        
        session_id = assignment.get("session_id", "unknown")
        assignment_id = assignment.get("assignment_id", "unknown")
        session_dir = Path("learn_files/assignments/sessions") / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        
        assignment_file = session_dir / f"{assignment_id}.json"
        with open(assignment_file, 'w', encoding='utf-8') as f:
            json.dump(assignment, f, indent=2, ensure_ascii=False)
        
        return str(assignment_file)
    
    def get_assignment(self, assignment_id: str) -> dict:
        """Get assignment by ID."""
        import json
        from pathlib import Path
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("assignments")
            if collection is not None:
                data = collection.find_one({"assignment_id": assignment_id})
                if data:
                    if "_id" in data:
                        del data["_id"]
                    return data
        
        # Fallback to JSON
        sessions_dir = Path("learn_files/assignments/sessions")
        if sessions_dir.exists():
            for session_dir in sessions_dir.iterdir():
                if session_dir.is_dir():
                    assignment_file = session_dir / f"{assignment_id}.json"
                    if assignment_file.exists():
                        with open(assignment_file, 'r', encoding='utf-8') as f:
                            return json.load(f)
        return None
    
    def list_assignments(self, session_id: str) -> list:
        """List all assignments for a session."""
        import json
        from pathlib import Path
        
        assignments = []
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("assignments")
            if collection is not None:
                cursor = collection.find({"session_id": session_id})
                for data in cursor:
                    if "_id" in data:
                        del data["_id"]
                    assignments.append({
                        "assignment_id": data.get("assignment_id", ""),
                        "generated_at": data.get("generated_at", ""),
                        "total_questions": data.get("total_questions", 0),
                        "difficulty": data.get("difficulty", "intermediate")
                    })
                return sorted(assignments, key=lambda x: x.get("generated_at", ""), reverse=True)
        
        # JSON fallback
        session_dir = Path("learn_files/assignments/sessions") / session_id
        if session_dir.exists():
            for file_path in session_dir.glob("*.json"):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        assignments.append({
                            "assignment_id": data.get("assignment_id", ""),
                            "generated_at": data.get("generated_at", ""),
                            "total_questions": data.get("total_questions", 0),
                            "difficulty": data.get("difficulty", "intermediate")
                        })
                except:
                    pass
        
        return sorted(assignments, key=lambda x: x.get("generated_at", ""), reverse=True)
    
    def save_assignment_result(self, user_id: str, assignment_id: str, result: dict) -> str:
        """
        Save assignment result.
        If MongoDB: store in results collection.
        If JSON: save as JSON file.
        """
        import json
        from datetime import datetime
        from pathlib import Path
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("results")
            if collection is not None:
                result["assignment_id"] = assignment_id
                result["user_id"] = user_id
                result["evaluated_at"] = datetime.now().isoformat()
                collection.update_one(
                    {"assignment_id": assignment_id, "user_id": user_id},
                    {"$set": result},
                    upsert=True
                )
                # Update profile
                self._update_profile_with_result(user_id, assignment_id, result)
                return assignment_id
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        return self._save_assignment_result_json(user_id, assignment_id, result)
    
    def _save_assignment_result_json(self, user_id: str, assignment_id: str, result: dict) -> str:
        """Internal: save result as JSON file."""
        import json
        from datetime import datetime
        from pathlib import Path
        
        user_dir = Path("learn_files/assignments/results") / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        result_file = user_dir / f"{assignment_id}_result.json"
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        # Also update user profile
        self._update_profile_with_result(user_id, assignment_id, result)
        
        return str(result_file)
    
    def _update_profile_with_result(self, user_id: str, assignment_id: str, result: dict):
        """Update user profile with assignment result."""
        profile = self.load_profile(user_id)
        if profile:
            profile.assignments.append({
                "assignment_id": assignment_id,
                "score": result.get("scores", {}).get("total", {}).get("percentage", 0),
                "grade": result.get("scores", {}).get("total", {}).get("grade", "N/A"),
                "date": datetime.now().isoformat()
            })
            self.save_profile(profile)
    
    def get_user_results(self, user_id: str) -> list:
        """Get all results for a user."""
        import json
        from pathlib import Path
        
        results = []
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("results")
            if collection is not None:
                cursor = collection.find({"user_id": user_id}).sort("evaluated_at", -1)
                for data in cursor:
                    if "_id" in data:
                        del data["_id"]
                    results.append(data)
                return results
        
        # JSON fallback
        user_dir = Path("learn_files/assignments/results") / user_id
        if user_dir.exists():
            for file_path in sorted(user_dir.glob("*.json"), reverse=True):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        results.append(json.load(f))
                except:
                    pass
        
        return results
    
    def save_progress_summary(self, user_id: str, progress: dict) -> str:
        """
        Save progress summary.
        If MongoDB: store in progress collection.
        If JSON: save as JSON file.
        """
        import json
        from datetime import datetime
        from pathlib import Path
        
        if self.storage_type == "mongodb":
            collection = self._get_collection("progress")
            if collection is not None:
                progress["user_id"] = user_id
                progress["updated_at"] = datetime.now().isoformat()
                collection.update_one(
                    {"user_id": user_id},
                    {"$set": progress},
                    upsert=True
                )
                return f"progress_{user_id}"
            else:
                print("⚠️ MongoDB collection not available, falling back to JSON")
        
        # JSON fallback
        return self._save_progress_summary_json(user_id, progress)
    
    def _save_progress_summary_json(self, user_id: str, progress: dict) -> str:
        """Internal: save progress summary as JSON file."""
        import json
        from pathlib import Path
        
        progress_file = Path("learn_files/assignments/progress") / f"{user_id}_progress.json"
        progress_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump(progress, f, indent=2, ensure_ascii=False)
        
        return str(progress_file)
    
    # ==================== MENTORING (SQLite) MANAGEMENT ====================
    
    def init_mentoring_db(self):
        """Initialize mentoring SQLite database."""
        import sqlite3
        from pathlib import Path
        
        db_path = Path("learn_files/mentoring/mentoring_memory.db")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.mentoring_conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self.mentoring_cursor = self.mentoring_conn.cursor()
        
        self.mentoring_cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                mode TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                message_count INTEGER DEFAULT 0,
                token_count INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1
            )
        """)
        
        self.mentoring_cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                token_count INTEGER DEFAULT 0,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        """)
        
        self.mentoring_cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_content_cache (
                session_id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                topics TEXT,
                phases TEXT,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.mentoring_cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)")
        self.mentoring_cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)")
        self.mentoring_cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)")
        self.mentoring_cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)")
        
        self.mentoring_conn.commit()
    
    def _ensure_mentoring_db(self):
        """Ensure mentoring DB is initialized."""
        if not hasattr(self, 'mentoring_conn'):
            self.init_mentoring_db()
    
    def create_mentoring_conversation(self, user_id: str, session_id: str = None, mode: str = "session") -> str:
        """Create a new conversation."""
        from datetime import datetime
        
        self._ensure_mentoring_db()
        
        if mode == "full" and session_id is None:
            session_id = f"all_sessions_{user_id}"
        
        if session_id:
            self.mentoring_cursor.execute("""
                SELECT id FROM conversations 
                WHERE user_id = ? AND session_id = ? AND is_active = 1
                ORDER BY last_accessed DESC LIMIT 1
            """, (user_id, session_id))
            
            result = self.mentoring_cursor.fetchone()
            if result:
                return str(result[0])
        
        self.mentoring_cursor.execute("""
            INSERT INTO conversations (session_id, user_id, mode, created_at, last_accessed)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, user_id, mode, datetime.now().isoformat(), datetime.now().isoformat()))
        
        self.mentoring_conn.commit()
        return str(self.mentoring_cursor.lastrowid)
    
    def add_mentoring_message(self, conversation_id: str, role: str, content: str):
        """Add a message to a conversation."""
        from datetime import datetime
        
        self._ensure_mentoring_db()
        
        token_count = len(content) // 4
        
        self.mentoring_cursor.execute("""
            INSERT INTO messages (conversation_id, role, content, timestamp, token_count)
            VALUES (?, ?, ?, ?, ?)
        """, (conversation_id, role, content, datetime.now().isoformat(), token_count))
        
        self.mentoring_cursor.execute("""
            UPDATE conversations 
            SET last_accessed = ?, message_count = message_count + 1, token_count = token_count + ?
            WHERE id = ?
        """, (datetime.now().isoformat(), token_count, conversation_id))
        
        self.mentoring_conn.commit()
    
    def get_mentoring_conversation_history(self, conversation_id: str, limit: int = 20) -> list:
        """Get conversation history."""
        self._ensure_mentoring_db()
        
        self.mentoring_cursor.execute("""
            SELECT role, content, timestamp FROM messages 
            WHERE conversation_id = ? 
            ORDER BY timestamp DESC LIMIT ?
        """, (conversation_id, limit))
        
        rows = self.mentoring_cursor.fetchall()
        return [{"role": row[0], "content": row[1], "timestamp": row[2]} for row in rows[::-1]]
    
    def get_mentoring_conversation_info(self, conversation_id: str) -> dict:
        """Get conversation metadata."""
        self._ensure_mentoring_db()
        
        self.mentoring_cursor.execute("""
            SELECT id, session_id, user_id, mode, created_at, last_accessed, message_count, token_count
            FROM conversations WHERE id = ?
        """, (conversation_id,))
        
        row = self.mentoring_cursor.fetchone()
        if row:
            return {
                "id": row[0],
                "session_id": row[1],
                "user_id": row[2],
                "mode": row[3],
                "created_at": row[4],
                "last_accessed": row[5],
                "message_count": row[6],
                "token_count": row[7]
            }
        return {}
    
    def list_mentoring_conversations(self, user_id: str) -> list:
        """List all conversations for a user."""
        import json
        from pathlib import Path
        
        self._ensure_mentoring_db()
        
        self.mentoring_cursor.execute("""
            SELECT id, session_id, mode, created_at, last_accessed, message_count
            FROM conversations 
            WHERE user_id = ? AND is_active = 1
            ORDER BY last_accessed DESC
        """, (user_id,))
        
        rows = self.mentoring_cursor.fetchall()
        conversations = []
        for row in rows:
            session_id = row[1]
            topic = "Unknown"
            if session_id:
                manifest_file = Path(f"learn_files/manifests/{session_id}_manifest.json")
                if manifest_file.exists():
                    try:
                        with open(manifest_file, 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                            topic = manifest.get("main_topic", "Unknown")
                    except:
                        pass
            
            conversations.append({
                "id": row[0],
                "session_id": row[1],
                "mode": row[2],
                "created_at": row[3],
                "last_accessed": row[4],
                "message_count": row[5],
                "topic": topic
            })
        
        return conversations
    
    def get_mentoring_session_content(self, session_id: str) -> dict:
        """Get cached session content or load from manifest."""
        import json
        from datetime import datetime
        from pathlib import Path
        
        self._ensure_mentoring_db()
        
        self.mentoring_cursor.execute("""
            SELECT content, topics, phases FROM session_content_cache 
            WHERE session_id = ?
        """, (session_id,))
        
        result = self.mentoring_cursor.fetchone()
        if result:
            return {
                "content": result[0],
                "topics": json.loads(result[1]) if result[1] else [],
                "phases": json.loads(result[2]) if result[2] else []
            }
        
        manifest_file = Path(f"learn_files/manifests/{session_id}_manifest.json")
        if not manifest_file.exists():
            return {"content": "", "topics": [], "phases": []}
        
        try:
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            watch_order = manifest.get("watch_order", [])
            topics = [item.get("topic", "") for item in watch_order if item.get("topic")]
            phases = list(set([item.get("phase", "") for item in watch_order if item.get("phase")]))
            
            content_parts = []
            for item in watch_order[:10]:
                text_file = item.get("text_file", "")
                if text_file:
                    try:
                        filepath = Path(text_file)
                        if filepath.exists():
                            with open(filepath, 'r', encoding='utf-8') as f:
                                lesson_content = f.read()
                                content_parts.append(f"Topic: {item.get('topic', '')}")
                                content_parts.append(lesson_content[:1000])
                    except:
                        pass
            
            full_content = "\n\n".join(content_parts)
            
            self.mentoring_cursor.execute("""
                INSERT OR REPLACE INTO session_content_cache 
                (session_id, content, topics, phases, cached_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                session_id,
                full_content[:50000],
                json.dumps(topics[:20]),
                json.dumps(phases[:10]),
                datetime.now().isoformat()
            ))
            self.mentoring_conn.commit()
            
            return {
                "content": full_content[:50000],
                "topics": topics[:20],
                "phases": phases[:10]
            }
        except Exception as e:
            print(f"⚠️ Error loading session content: {e}")
            return {"content": "", "topics": [], "phases": []}
    
    def get_mentoring_all_user_content(self, user_id: str) -> dict:
        """Get all content from all sessions of a user."""
        all_topics = []
        all_phases = []
        all_content = []
        
        sessions = self.get_user_sessions(user_id)
        for session in sessions:
            session_id = session.session_id
            content = self.get_mentoring_session_content(session_id)
            if content.get("content"):
                all_content.append(f"Session: {session_id[:20]}...")
                all_content.append(content["content"])
                all_topics.extend(content.get("topics", []))
                all_phases.extend(content.get("phases", []))
        
        return {
            "content": "\n\n".join(all_content)[:100000],
            "topics": list(set(all_topics))[:30],
            "phases": list(set(all_phases))[:15]
        }
    
    def manage_mentoring_history(self, conversation_id: str):
        """Manage conversation history by summarizing old messages."""
        self._ensure_mentoring_db()
        
        try:
            self.mentoring_cursor.execute("""
                SELECT id, role, content, timestamp FROM messages 
                WHERE conversation_id = ? 
                ORDER BY timestamp ASC
            """, (conversation_id,))
            
            messages = self.mentoring_cursor.fetchall()
            
            if len(messages) > 20:
                keep_ids = [m[0] for m in messages[-15:]]
                
                self.mentoring_cursor.execute("""
                    DELETE FROM messages 
                    WHERE conversation_id = ? AND id NOT IN ({})
                """.format(','.join('?' * len(keep_ids))), [conversation_id] + keep_ids)
                
                self.mentoring_cursor.execute("""
                    UPDATE conversations 
                    SET message_count = ? 
                    WHERE id = ?
                """, (len(keep_ids), conversation_id))
                
                self.mentoring_conn.commit()
        except Exception as e:
            print(f"⚠️ History management error: {e}")
    
    def garbage_collect_mentoring(self, max_conversation_age_days: int = 7, max_messages_per_session: int = 50):
        """Clean up old conversations."""
        from datetime import datetime, timedelta
        
        self._ensure_mentoring_db()
        
        try:
            cutoff_date = (datetime.now() - timedelta(days=max_conversation_age_days)).isoformat()
            self.mentoring_cursor.execute("""
                DELETE FROM conversations 
                WHERE last_accessed < ? AND is_active = 0
            """, (cutoff_date,))
            
            self.mentoring_cursor.execute("""
                SELECT id, message_count FROM conversations 
                WHERE message_count > ?
            """, (max_messages_per_session,))
            
            over_limit = self.mentoring_cursor.fetchall()
            
            for conv_id, count in over_limit:
                keep_count = min(30, max_messages_per_session // 2)
                self.mentoring_cursor.execute("""
                    DELETE FROM messages 
                    WHERE conversation_id = ? 
                    AND id NOT IN (
                        SELECT id FROM messages 
                        WHERE conversation_id = ? 
                        ORDER BY timestamp DESC 
                        LIMIT ?
                    )
                """, (conv_id, conv_id, keep_count))
                
                self.mentoring_cursor.execute("""
                    UPDATE conversations 
                    SET message_count = ? 
                    WHERE id = ?
                """, (keep_count, conv_id))
            
            self.mentoring_cursor.execute("""
                DELETE FROM messages 
                WHERE conversation_id NOT IN (SELECT id FROM conversations)
            """)
            
            self.mentoring_conn.commit()
        except Exception as e:
            print(f"⚠️ Garbage collection error: {e}")
    
    def get_mentoring_session_topic(self, session_id: str) -> str:
        """Get the topic of a session."""
        import json
        from pathlib import Path
        
        if not session_id:
            return "Unknown"
        
        manifest_file = Path(f"learn_files/manifests/{session_id}_manifest.json")
        if manifest_file.exists():
            try:
                with open(manifest_file, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)
                    return manifest.get("main_topic", "Unknown")
            except:
                pass
        
        return "Unknown"
    
    def close_mentoring_db(self):
        """Close mentoring database connection."""
        if hasattr(self, 'mentoring_conn'):
            self.mentoring_conn.close()
    
    def close(self):
        """Close all connections."""
        self.close_mentoring_db()
    
    def export_data(self, user_id: str, export_dir: str = "exports") -> str:
        """Export all data for a user"""
        export_path = Path(export_dir) / user_id
        export_path.mkdir(parents=True, exist_ok=True)
        
        # Export profile
        profile = self.load_profile(user_id)
        if profile:
            with open(export_path / "profile.json", 'w') as f:
                json.dump(profile.to_dict(), f, indent=2)
        
        # Export sessions
        sessions = self.get_user_sessions(user_id)
        sessions_data = [s.to_dict() for s in sessions]
        with open(export_path / "sessions.json", 'w') as f:
            json.dump(sessions_data, f, indent=2)
        
        return str(export_path)