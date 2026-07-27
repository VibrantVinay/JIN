# D:\Jinvexa\sync_users.py

"""
Sync users from .testauth file to MongoDB.
Run this script once to migrate existing users.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from Agents.AuthManager import sync_from_file, get_auth_stats


def main():
    print("="*60)
    print("📋 JINVEXA - User Sync Utility")
    print("="*60)
    
    # Check if .testauth exists
    auth_file = Path(".testauth")
    if auth_file.exists():
        print(f"\n📄 Found {auth_file}")
        with open(auth_file, 'r') as f:
            lines = [l.strip() for l in f.readlines() if l.strip() and not l.startswith('#')]
            print(f"   Users in file: {len(lines)}")
        
        # Sync users
        synced = sync_from_file()
        print(f"\n✅ Synced {synced} users to MongoDB")
    else:
        print("\n⚠️ .testauth file not found.")
        print("   Creating default users...")
        
        from Agents.AuthManager import auth_manager
        default_users = [
            ("admin", "admin123"),
            ("alice", "alice123"),
            ("bob", "bob123"),
            ("carol", "carol123"),
            ("testuser", "test123")
        ]
        for u, p in default_users:
            auth_manager.add_user(u, p)
        print(f"✅ Created {len(default_users)} default users")
    
    # Show stats
    stats = get_auth_stats()
    print("\n📊 Auth Stats:")
    print(f"   Total Users: {stats['total_users']}")
    print(f"   MongoDB Connected: {stats['mongodb_connected']}")
    if stats.get('mongodb_users'):
        print(f"   MongoDB Users: {stats['mongodb_users']}")
    print(f"   Cache Size: {stats['cache_size']}")
    
    print("\n" + "="*60)
    print("✅ Sync complete!")


if __name__ == "__main__":
    main()