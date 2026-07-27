# D:\Jinvexa\app.py

import sys
import os
import asyncio
import json
import re
import codecs
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import modules
from DataHandle.Utils.DataExtractor import DataExtract
from Agents.ConceptExtractionAgent import ConceptExtractionAgent
from Agents.DependencyAgent import DependencyAgent
from Agents.KnowledgeGapAgent import KnowledgeGapAgent
from Agents.LearningDiscoveryAgent import LearningDiscoveryAgent
from Agents.MemoryHandler import MemoryHandler
from Agents.TeachingAgent import TeachingAgent
from Agents.AssignmentGeneratorAgent import AssignmentGeneratorAgent
from Agents.AssignmentEvaluatorAgent import AssignmentEvaluatorAgent
from Agents.AssignmentTrackerAgent import AssignmentTrackerAgent
from Agents.MentoringAgent import MentoringAgent
from Agents.AuthManager import AuthManager
from Models.UserProfile import UserProfile
from Config.Config import Config


# ==================== CONFIGURATION ====================

# Load environment variables
load_dotenv()

# Ollama Configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:31b-cloud")

# Storage Configuration
STORAGE_DIR = os.getenv("STORAGE_DIR", "memory_storage")
STORAGE_TYPE = os.getenv("STORAGE_TYPE", "json")

# Suppress httpx logs
import logging
logging.getLogger("httpx").setLevel(logging.WARNING)


# ==================== OLLAMA LLM CLIENT ====================

class OllamaLLMClient:
    """
    Ollama LLM Client - The brain for all agents.
    """

    def __init__(self, model: str = OLLAMA_MODEL):
        self.model = model
        
        # Import ollama
        import ollama
        self.ollama = ollama
        
        logger = logging.getLogger("Ollama")
        logger.info(f"Using Ollama model: {self.model}")
    
    async def complete(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Send a completion request to Ollama.
        """
        messages = []
        
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": prompt
        })

        try:
            import asyncio
            response = await asyncio.to_thread(
                self.ollama.chat,
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.3,
                    "num_predict": 2000
                }
            )
            
            # Handle response
            if hasattr(response, 'message'):
                if hasattr(response.message, 'content'):
                    return response.message.content
                elif isinstance(response.message, dict):
                    return response.message.get('content', '')
            elif isinstance(response, dict):
                return response.get('message', {}).get('content', '')
            
            return str(response)
            
        except Exception as e:
            logger = logging.getLogger("Ollama")
            logger.error(f"Ollama API Error: {e}")
            return json.dumps({
                "main_topic": "General Learning",
                "subtopics": [],
                "domain": "General",
                "difficulty": "intermediate",
                "keywords": []
            })
    
    async def complete_with_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a completion request and parse response as JSON.
        """
        response = await self.complete(prompt, system_prompt)
        
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        try:
            return json.loads(response)
        except:
            return {}


# ==================== JINVEXA APP ====================

class JinvexaApp:
    """Main application class for Jinvexa Learning Platform"""
    
    def __init__(self):
        # Setup structured logging FIRST
        self._setup_logging()
        # Detect terminal width for aligned UI
        self.terminal_width = self._get_terminal_width()
        
        # Create necessary directories
        Path("profiles").mkdir(exist_ok=True)
        Path(STORAGE_DIR).mkdir(exist_ok=True)
        
        # Initialize Auth Manager FIRST
        self.auth = AuthManager()
        self.current_user_id: Optional[int] = None
        self.current_username: Optional[str] = None
        
        # Initialize Config
        self.config = Config()

        # Initialize Ollama LLM Client
        self.llm_client = OllamaLLMClient()
        
        # Initialize Memory Handler
        self.memory = MemoryHandler(
            storage_dir=STORAGE_DIR,
            storage_type=STORAGE_TYPE
        )
        
        # Initialize DataExtractor with the llm_client
        self.data_extractor = DataExtract(llm_client=self.llm_client)
        
        # Initialize Agents with Ollama LLM
        self.concept_extractor = ConceptExtractionAgent(self.llm_client)
        self.dependency_agent = DependencyAgent(self.llm_client)
        self.knowledge_gap_agent = KnowledgeGapAgent(self.llm_client)
        
        # Initialize Learning Discovery Agent with Memory
        self.learning_discovery = LearningDiscoveryAgent(
            data_extractor=self.data_extractor,
            concept_extractor=self.concept_extractor,
            dependency_agent=self.dependency_agent,
            knowledge_gap_agent=self.knowledge_gap_agent,
            llm_client=self.llm_client,
            memory_handler=self.memory
        )
        
        # Initialize Teaching Agent
        self.teaching_agent = TeachingAgent(
            llm_client=self.llm_client,
            memory_handler=self.memory
        )
        
        # Initialize Assignment Agents
        self.assignment_generator = AssignmentGeneratorAgent(
            llm_client=self.llm_client,
            memory_handler=self.memory
        )
        
        self.assignment_evaluator = AssignmentEvaluatorAgent(
            llm_client=self.llm_client,
            memory_handler=self.memory,
            assignment_generator=self.assignment_generator
        )
        
        self.assignment_tracker = AssignmentTrackerAgent(
            llm_client=self.llm_client,
            memory_handler=self.memory
        )
        
        # Initialize Mentoring Agent
        self.mentoring_agent = MentoringAgent(
            llm_client=self.llm_client,
            memory_handler=self.memory
        )
        
        self.current_profile = None
    
    def display_login(self) -> bool:
        """Display login screen and authenticate user."""
        self.show_section("🔐 JINVEXA LOGIN")
        
        users = self.auth.list_users()
        if users:
            user_display = [u.get("username") for u in users]
            self.show_message(f"\n📋 Available users: {', '.join(user_display)}")
        else:
            self.show_message("\n📋 No users found. Creating default users...")
            default_users = [
                ("admin", "admin123"),
                ("alice", "alice123"),
                ("bob", "bob123"),
                ("carol", "carol123"),
                ("testuser", "test123")
            ]
            for u, p in default_users:
                self.auth.add_user(u, p)
            users = self.auth.list_users()
            user_display = [u.get("username") for u in users]
            self.show_message(f"\n📋 Available users: {', '.join(user_display)}")
        
        self.show_message("   (Users stored in MongoDB)")
        self.show_message("")
        
        max_attempts = 3
        attempts = 0
        
        while attempts < max_attempts:
            username = self.get_user_input("👤 Username")
            password = self.get_user_input("🔑 Password")
            
            user_id = self.auth.authenticate(username, password)
            if user_id:
                self.current_user_id = user_id
                self.current_username = username
                self.show_message(f"\n✅ Welcome back, {username}! 🎉")
                self.show_section("", char="=")
                return True
            else:
                attempts += 1
                remaining = max_attempts - attempts
                self.show_message(f"❌ Invalid username or password. {remaining} attempts remaining.", "WARNING")
        
        self.show_message("\n❌ Too many failed attempts. Exiting...", "ERROR")
        return False
    
    def display_banner(self):
        """Display application banner with user info."""
        username = self.current_username if self.current_username else "Not Logged In"
        user_id = self.current_user_id if self.current_user_id else "N/A"
        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         🧠  J I N V E X A  L E A R N I N G  A I               ║
║                                                                  ║
║     "Tell me what you want to become.                           ║
║      I'll build your university."                               ║
║                                                                  ║
║     🤖 Brain: {self.llm_client.model:<20}                       ║
║     💾 Storage: {STORAGE_TYPE.upper():<8}                       ║
║     👤 User: {username} (ID: {user_id})                         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
        """)
        self.log_info(f"Starting Jinvexa Learning AI for user: {username} (ID: {user_id})")
    
    def _setup_logging(self):
        """Setup structured logging for all agents."""
        console_formatter = logging.Formatter('[%(levelname)s] %(name)s: %(message)s')
        file_formatter = logging.Formatter('[%(levelname)s] %(name)s: %(message)s')

        # Force UTF-8 encoding for Windows console
        if sys.platform == "win32":
            try:
                sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
            except Exception:
                pass
            try:
                sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
            except Exception:
                pass

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)

        # File handler
        file_handler = logging.FileHandler('jinvexa.log', encoding='utf-8')
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.INFO)

        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        root_logger.handlers.clear()
        root_logger.addHandler(console_handler)
        root_logger.addHandler(file_handler)

        # File-only logger
        file_only_logger = logging.getLogger("AppFile")
        file_only_logger.setLevel(logging.INFO)
        file_only_logger.propagate = False
        file_only_logger.handlers.clear()
        file_only_logger.addHandler(file_handler)
    
    def log_info(self, message: str, level: str = "INFO"):
        """Centralized logging from app.py."""
        logger = logging.getLogger("App")
        if level == "INFO":
            logger.info(message)
        elif level == "WARNING":
            logger.warning(message)
        elif level == "ERROR":
            logger.error(message)
        else:
            logger.info(message)
    
    def get_user_input(self, prompt: str, default: str = "") -> str:
        """Centralized user input handling."""
        self.log_info(f"Waiting for user input: {prompt[:50]}...")
        if default:
            user_input = input(f"{prompt} (default: {default}): ").strip()
            return user_input if user_input else default
        return input(f"{prompt}: ").strip()
    
    def show_message(self, message: str, level: str = "INFO", log_only: bool = False):
        """Centralized message display."""
        clean_message = message
        if sys.platform == "win32" and not self._supports_emoji():
            try:
                emoji_pattern = re.compile("["
                    u"\U0001F600-\U0001F64F"
                    u"\U0001F300-\U0001F5FF"
                    u"\U0001F680-\U0001F6FF"
                    u"\U0001F1E0-\U0001F1FF"
                    u"\U0001F700-\U0001F77F"
                    u"\U0001F780-\U0001F7FF"
                    u"\U0001F800-\U0001F8FF"
                    u"\U0001F900-\U0001F9FF"
                    u"\U0001FA00-\U0001FA6F"
                    u"\U0001FA70-\U0001FAFF"
                    u"\u2702-\u27B0"
                    u"\u24C2-\U0001F251"
                    "]+", flags=re.UNICODE)
                clean_message = emoji_pattern.sub(r'', message)
            except Exception:
                clean_message = message

        self._log_only(message, level)

        if not log_only:
            print(clean_message)
    
    def show_section(self, title: str, char: str = "─", length: int = 60):
        """Centralized section display."""
        self._log_only(f"Section: {title}")
        if not title:
            print(f"\n{char * length}")
            return

        padding = max(0, length - len(title) - 4)
        print(f"\n{char * 2} {title} {char * padding}")

    def _get_terminal_width(self) -> int:
        """Get terminal width for proper alignment."""
        try:
            return shutil.get_terminal_size().columns
        except Exception:
            return 80

    def _log_only(self, message: str, level: str = "INFO"):
        """Log to file-only logger."""
        logger = logging.getLogger("AppFile")
        if level == "INFO":
            logger.info(message)
        elif level == "WARNING":
            logger.warning(message)
        elif level == "ERROR":
            logger.error(message)
        else:
            logger.info(message)

    def show_menu(self, options: List[Dict], title: str = "Jinvexa Learning Platform"):
        """Display a professional menu with proper alignment."""
        width = min(max(40, self.terminal_width - 4), 80)

        # Top border and title
        title_text = f" {title} "
        left = f"  ┌─{title_text}"
        right_len = max(0, width - len(title_text) - 6)
        line = left + "─" * right_len
        self._log_only(line)
        print(line)

        # Empty spacer
        self._log_only("  │")
        print("  │")

        # Group options by category
        categories = {}
        for opt in options:
            cat = opt.get("category", "General")
            categories.setdefault(cat, []).append(opt)

        for i, (cat, items) in enumerate(categories.items()):
            cat_line = f"  │  {cat}"
            self._log_only(cat_line)
            print(cat_line)

            for item in items:
                num = item.get("num", "")
                name = item.get("name", "")
                desc = item.get("desc", "")
                if desc:
                    line = f"  │    {num}.  {name} ({desc})"
                else:
                    line = f"  │    {num}.  {name}"
                self._log_only(line)
                print(line)

            if i < len(categories) - 1:
                self._log_only("  │")
                print("  │")

        # Bottom spacer and border
        self._log_only("  │")
        print("  │")
        bottom = "  └" + "─" * (width + 1)
        self._log_only(bottom)
        print(bottom)

    def _supports_emoji(self) -> bool:
        """Detect simple terminal emoji support."""
        try:
            if 'WT_SESSION' in os.environ:
                return True
            if 'TERM_PROGRAM' in os.environ:
                return True
            return False
        except Exception:
            return False
    
    # ==================== MODE METHODS ====================
    
    async def run_mode_1_goal(self):
        """Mode 1: Goal-based learning with interactive conversation"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section(f"📚 MODE 1: Goal-Based Learning")
        
        goal = self.get_user_input("\n🎯 What do you want to learn?", "e.g., 'I want to become an AI Engineer'")
        if not goal:
            self.show_message("❌ Please enter a learning goal.", "WARNING")
            return
        
        # Load existing profile using user_id
        profile = self.memory.load_profile(user_id)
        if profile:
            self.show_message(f"✅ Loaded existing profile for '{username}' (ID: {user_id}) ({len(profile.known_concepts)} concepts)")
        else:
            profile = UserProfile(user_id=user_id)
            self.show_message(f"🆕 Created new profile for '{username}' (ID: {user_id})")
        
        self.show_message("\n🔄 Analyzing your goal and creating personalized learning plan...\n")
        
        try:
            conversation, questions, session_id = await self.learning_discovery.start_goal_conversation(
                user_id=user_id,
                goal_statement=goal,
                user_profile=profile
            )
            
            self.show_section("💬 DISCOVERY CONVERSATION")
            
            for msg in conversation:
                role = "🤖 Agent" if msg.get("role") == "agent" else "👤 You"
                message = msg.get("message", msg.get("question", str(msg)))
                self.show_message(f"\n[{role}]: {message}")
            
            self.show_section("💬 INTERACTIVE DISCOVERY")
            self.show_message("Type 'quit' to skip questions and generate plan\n")
            
            answered = 0
            total_questions = len(questions) if questions else 0
            
            while answered < total_questions:
                user_input = self.get_user_input("\n👤 Your answer")
                if user_input.lower() in ['quit', 'exit', 'done']:
                    break
                
                if not user_input:
                    continue
                
                result = await self.learning_discovery.process_answer(
                    session_id=session_id,
                    answer=user_input,
                    question_index=answered
                )
                
                if result.get("type") == "plan_ready":
                    self.show_message("\n✅ Great! Learning plan generated!\n", "SUCCESS")
                    plan_data = result.get("plan")
                    if plan_data:
                        self._display_plan(plan_data)
                    else:
                        self.show_message("⚠️ Plan generated but data is empty.", "WARNING")
                    break
                elif result.get("type") == "next_question":
                    answered += 1
                    self.show_message(f"\n🤖 Agent: {result.get('question')}")
                    if result.get('options'):
                        self.show_message(f"   Options: {', '.join(result['options'])}")
                    if result.get('progress'):
                        self.show_message(f"   Progress: {result['progress']}")
                elif result.get("error"):
                    self.show_message(f"❌ {result.get('error')}", "ERROR")
                    break
            
            stats = self.memory.get_user_stats(user_id)
            self.show_message(f"\n📊 Learning Stats:")
            self.show_message(f"   Sessions: {stats['total_sessions']} | Messages: {stats['total_conversations']}")
            if stats.get('knowledge_progress'):
                self.show_message(f"   Known Concepts: {stats['knowledge_progress'].get('known_concepts', 0)}")
            
        except Exception as e:
            self.show_message(f"❌ Error: {e}", "ERROR")
            import traceback
            traceback.print_exc()
    
    async def run_mode_2_reference(self):
        """Mode 2: Reference-Based Learning"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section(f"📚 MODE 2: Reference-Based Learning")
        
        source = self.get_user_input("\n📎 Enter URL, file path, or YouTube link")
        if not source:
            self.show_message("❌ Please provide a valid source.", "WARNING")
            return
        
        self.show_message("\n🔄 Extracting content...")
        try:
            result = self.data_extractor.extract(source)
            source_type = result.get('type', 'unknown')
            self.show_message(f"✅ Type: {source_type}")
            
            data = result.get('data', {})
            if isinstance(data, dict):
                content = data.get('content', '')
                if content and len(content) > 100:
                    preview = content[:500] + "..." if len(content) > 500 else content
                    self.show_message(f"\n📄 Content preview ({len(content)} chars):\n{preview[:300]}...\n")
                elif content:
                    self.show_message(f"\n📄 Content length: {len(content)} chars")
                else:
                    self.show_message("⚠️  No content extracted")
                    
        except Exception as e:
            self.show_message(f"❌ Extraction failed: {e}", "ERROR")
            return
        
        profile = self.memory.load_profile(user_id)
        if profile:
            self.show_message(f"✅ Loaded existing profile for '{username}' (ID: {user_id}) ({len(profile.known_concepts)} concepts)")
        else:
            profile = UserProfile(user_id=user_id)
            self.show_message(f"🆕 Created new profile for '{username}' (ID: {user_id})")
        
        self.show_message("\n🔄 Analyzing your reference and creating personalized learning plan...\n")
        
        try:
            conversation, questions, session_id = await self.learning_discovery.start_reference_conversation(
                user_id=user_id,
                source=source,
                user_profile=profile
            )
            
            self.show_section("💬 DISCOVERY CONVERSATION")
            
            for msg in conversation:
                role = "🤖 Agent" if msg.get("role") == "agent" else "👤 You"
                message = msg.get("message", msg.get("question", str(msg)))
                self.show_message(f"\n[{role}]: {message}")
            
            self.show_section("💬 INTERACTIVE DISCOVERY")
            self.show_message("Type 'quit' to skip questions and generate plan\n")
            
            answered = 0
            total_questions = len(questions) if questions else 0
            
            while answered < total_questions:
                user_input = self.get_user_input("\n👤 Your answer")
                if user_input.lower() in ['quit', 'exit', 'done']:
                    break
                
                if not user_input:
                    continue
                
                result = await self.learning_discovery.process_answer(
                    session_id=session_id,
                    answer=user_input,
                    question_index=answered
                )
                
                if result.get("type") == "plan_ready":
                    self.show_message("\n✅ Great! Learning plan generated!\n", "SUCCESS")
                    plan_data = result.get("plan")
                    if plan_data:
                        self._display_plan(plan_data)
                    else:
                        self.show_message("⚠️ Plan generated but data is empty.", "WARNING")
                    break
                elif result.get("type") == "next_question":
                    answered += 1
                    self.show_message(f"\n🤖 Agent: {result.get('question')}")
                    if result.get('options'):
                        self.show_message(f"   Options: {', '.join(result['options'])}")
                    if result.get('progress'):
                        self.show_message(f"   Progress: {result['progress']}")
                elif result.get("error"):
                    self.show_message(f"❌ {result.get('error')}", "ERROR")
                    break
            
            stats = self.memory.get_user_stats(user_id)
            self.show_message(f"\n📊 Learning Stats:")
            self.show_message(f"   Sessions: {stats['total_sessions']} | Messages: {stats['total_conversations']}")
            if stats.get('knowledge_progress'):
                self.show_message(f"   Known Concepts: {stats['knowledge_progress'].get('known_concepts', 0)}")
            
        except Exception as e:
            self.show_message(f"❌ Error: {e}", "ERROR")
            import traceback
            traceback.print_exc()
    
    # ==================== DISPLAY HELPERS ====================
    
    def _display_conversation(self, conversation):
        """Display the conversation with proper error handling"""
        self.show_section("💬 DISCOVERY CONVERSATION")
        
        if not conversation:
            self.show_message("No conversation history available.")
            return
        
        for msg in conversation:
            role = "🤖 Agent" if msg.get("role") == "agent" else "👤 You"
            
            if "question" in msg:
                message = msg.get("question", "")
            elif "message" in msg:
                message = msg.get("message", "")
            elif "content" in msg:
                message = msg.get("content", "")
            else:
                message = str(msg) if not isinstance(msg, dict) else "Unknown message"
            
            self.show_message(f"\n[{role}]: {message}")
    
    def _display_plan(self, plan):
        """Display the learning plan with safety checks"""
        if not plan:
            self.show_message("\n❌ No learning plan generated. Please try again.", "ERROR")
            return
        
        self.show_section("📚 YOUR PERSONALIZED LEARNING PLAN")
        
        if isinstance(plan, dict):
            main_topic = plan.get('main_topic', 'Unknown Topic')
            goal = plan.get('goal', 'Master the topic')
            estimated_time = plan.get('estimated_time_hours', 0)
            knowledge_gaps = plan.get('knowledge_gaps', [])
            roadmap = plan.get('roadmap', [])
            projects = plan.get('projects', [])
        else:
            main_topic = getattr(plan, 'main_topic', 'Unknown Topic')
            goal = getattr(plan, 'goal', 'Master the topic')
            estimated_time = getattr(plan, 'estimated_time_hours', 0)
            knowledge_gaps = getattr(plan, 'knowledge_gaps', [])
            roadmap = getattr(plan, 'roadmap', [])
            projects = getattr(plan, 'projects', [])
        
        self.show_message(f"\n📌 Topic: {main_topic}")
        self.show_message(f"🎯 Goal: {goal}")
        self.show_message(f"⏱️ Time: {estimated_time} hours")
        
        if knowledge_gaps:
            self.show_message("\n📖 Knowledge Gaps:")
            for gap in knowledge_gaps[:5]:
                self.show_message(f"  • {gap}")
        
        if roadmap:
            self.show_message("\n🗺️ Roadmap:")
            for phase in roadmap:
                self.show_message(f"\n  📍 Phase {phase.get('phase_number')}: {phase.get('title')}")
                self.show_message(f"     {phase.get('description', '')}")
                if phase.get('topics'):
                    self.show_message(f"     Topics: {', '.join(phase.get('topics', []))}")
                self.show_message(f"     ⏱️ {phase.get('estimated_hours', 0)} hours")
        
        if projects:
            self.show_message("\n🛠️ Projects:")
            for project in projects[:2]:
                self.show_message(f"  • {project.get('title', '')}")
        
        self.show_section("✅ Learning plan generated successfully!")
    
    # ==================== STATISTICS ====================
    
    async def run_show_stats(self):
        """Show user statistics"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📊 USER LEARNING STATISTICS")
        
        stats = self.memory.get_user_stats(user_id)
        
        self.show_message(f"\n📊 Stats for: {username} (ID: {user_id})")
        self.show_message(f"   Sessions: {stats['total_sessions']}")
        self.show_message(f"   Messages: {stats['total_conversations']}")
        
        if stats.get('knowledge_progress'):
            self.show_message(f"   Known Concepts: {stats['knowledge_progress'].get('known_concepts', 0)}")
            topics = stats['knowledge_progress'].get('topics', [])
            if topics:
                self.show_message(f"   Topics: {', '.join(topics[:5])}")
        
        if stats.get('learning_plans'):
            self.show_message(f"\n📚 Learning Plans:")
            for plan in stats['learning_plans'][:3]:
                self.show_message(f"   • {plan['topic']} - {plan['goal']} ({plan['estimated_hours']}h)")
    
    async def run_view_sessions(self):
        """View all sessions for a user"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📋 USER SESSIONS")
        
        sessions = self.memory.get_user_sessions(user_id)
        
        if not sessions:
            self.show_message(f"\nNo sessions found for: {username} (ID: {user_id})")
            return
        
        self.show_message(f"\n📋 Found {len(sessions)} sessions for {username}:")
        self.show_message("-" * 50)
        
        for i, session in enumerate(sessions, 1):
            self.show_message(f"{i}. {session.session_id[:20]}... ({session.mode})")
            self.show_message(f"   Created: {session.created_at[:19]}")
            self.show_message(f"   Messages: {len(session.conversation_history)}")
            if session.concepts and isinstance(session.concepts, dict):
                self.show_message(f"   Topic: {session.concepts.get('main_topic', 'Unknown')}")
            else:
                self.show_message(f"   Topic: Unknown")
            self.show_message("")
        
        choice = self.get_user_input("🔍 Enter session number to view details (or Enter to skip)")
        if choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(sessions):
                session = sessions[idx]
                summary = self.learning_discovery.get_session_summary(session.session_id)
                self.show_message("\n📋 Session Details:")
                self.show_message(json.dumps(summary, indent=2, default=str))
    
    # ==================== CONTINUE CONVERSATION ====================
    
    async def _handle_continue_conversation(self):
        """Handle continue conversation flow"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        
        sessions = self.memory.get_user_sessions(user_id)
        if sessions:
            self.show_message("\n📋 Recent sessions:")
            for i, s in enumerate(sessions[:5], 1):
                self.show_message(f"  {i}. {s.session_id[:20]}... ({s.mode}) - {s.created_at[:19]}")
            session_num = self.get_user_input("\nEnter session number")
            if session_num.isdigit():
                idx = int(session_num) - 1
                if 0 <= idx < len(sessions):
                    await self._continue_conversation(sessions[idx].session_id)
        else:
            self.show_message("❌ No sessions found.", "WARNING")
    
    async def _continue_conversation(self, session_id: str):
        """Continue an existing conversation"""
        self.show_section("💬 CONTINUING CONVERSATION")
        self.show_message("Type 'quit' to end.\n")
        
        while True:
            user_msg = self.get_user_input("👤 You")
            if user_msg.lower() in ['quit', 'exit', 'done']:
                break
            
            if not user_msg:
                continue
            
            result = self.learning_discovery.continue_conversation_with_memory(
                session_id, user_msg
            )
            
            if "error" in result:
                self.show_message(f"❌ {result['error']}", "ERROR")
                break
            
            history = result.get("conversation_history", [])
            if history:
                last_msg = history[-1]
                self.show_message(f"🤖 Agent: {last_msg['message']}")
    
    # ==================== TEACHING MODE ====================
    
    async def run_mode_teaching(self):
        """Mode 3: Teaching Layer - Generate lessons from learning plans"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📚 MODE 3: Teaching Layer")
        
        all_sessions = self.teaching_agent.list_available_sessions()
        
        if not all_sessions:
            self.show_message("❌ No sessions with learning plans found.", "WARNING")
            self.show_message("   Please create a learning plan first (Mode 1 or 2).")
            return
        
        sessions = [s for s in all_sessions if s.get("user_id", "").lower() == user_id.lower()]
        
        if not sessions:
            self.show_message(f"❌ No sessions found for user '{username}' (ID: {user_id}).", "WARNING")
            self.show_message("   Please create a learning plan first (Mode 1 or 2).")
            return
        
        self.show_message(f"\n📋 Available sessions for '{username}':")
        self.show_message("-" * 50)
        for i, session in enumerate(sessions, 1):
            self.show_message(f"{i}. Session: {session['session_id'][:20]}...")
            self.show_message(f"   Topic: {session.get('main_topic', 'Unknown')}")
            self.show_message(f"   Phases: {session.get('phase_count', 0)}")
            self.show_message(f"   Total Time: {session.get('total_hours', 0)} hours")
            self.show_message("")
        
        choice = self.get_user_input("\n🔍 Select session number to generate course")
        if not choice.isdigit():
            self.show_message("❌ Invalid selection.", "WARNING")
            return
        
        idx = int(choice) - 1
        if idx < 0 or idx >= len(sessions):
            self.show_message("❌ Invalid session number.", "WARNING")
            return
        
        selected_session = sessions[idx]
        session_id = selected_session["session_id"]
        
        self.show_message(f"\n📚 Generating course for: {selected_session.get('main_topic', 'Unknown')}")
        self.show_message(f"   Phases: {selected_session.get('phase_count', 0)}")
        self.show_message(f"   Total Time: {selected_session.get('total_hours', 0)} hours")
        
        self.show_message("\n🧠 AI is analyzing each topic to decide the best format...")
        self.show_message("   (text, female voice, or male voice based on content)\n")
        
        try:
            result = await self.teaching_agent.generate_course_from_session(
                session_id=session_id
            )
            
            if "error" in result:
                self.show_message(f"❌ Error: {result['error']}", "ERROR")
                return
            
            if result.get("format_decisions"):
                self.show_section("📋 FORMAT DECISIONS MADE BY AI")
                for decision in result["format_decisions"]:
                    output_format = decision.get("output_format", "text")
                    if output_format == "text":
                        emoji = "📄"
                        label = "Text (Self-paced reading)"
                    elif output_format == "female_voice":
                        emoji = "👩"
                        label = "Female Voice (Warm audio)"
                    elif output_format == "male_voice":
                        emoji = "👨"
                        label = "Male Voice (Professional audio)"
                    else:
                        emoji = "📄"
                        label = "Text"
                    self.show_message(f"   {emoji} {decision.get('topic')} → {label}")
                    self.show_message(f"      💡 {decision.get('reason', '')[:80]}...")
            
            self.show_section("✅ COURSE GENERATION COMPLETE")
            
            self.show_message(f"\n📌 Course: {result.get('main_topic', 'Unknown')}")
            self.show_message(f"📝 Total Lessons: {result.get('total_lessons', 0)}")
            
            manifest = result.get('manifest', [])
            if manifest:
                self.show_message("\n📋 WATCH ORDER (from manifest):")
                self.show_message("-" * 40)
                for item in manifest[:10]:
                    order = item.get('order', 0)
                    topic = item.get('topic', '')
                    content_type = item.get('content_type', 'text')
                    gender = item.get('gender', '')
                    
                    if content_type == 'audio':
                        icon = f"🎧 ({gender})"
                    else:
                        icon = "📄"
                    
                    self.show_message(f"   {order}. {icon} {topic}")
                
                if len(manifest) > 10:
                    self.show_message(f"   ... and {len(manifest) - 10} more lessons")
            
            text_files = result.get('text_files', [])
            audio_files = result.get('audio_files', [])
            
            if text_files:
                self.show_message(f"\n📄 Text Lessons ({len(text_files)} files):")
                for file in text_files[:5]:
                    self.show_message(f"   • {Path(file).name}")
                if len(text_files) > 5:
                    self.show_message(f"   ... and {len(text_files) - 5} more")
            
            if audio_files:
                self.show_message(f"\n🎧 Audio Lessons ({len(audio_files)} files):")
                for file in audio_files[:5]:
                    self.show_message(f"   • {Path(file).name}")
                if len(audio_files) > 5:
                    self.show_message(f"   ... and {len(audio_files) - 5} more")
            
            self.show_message(f"\n💾 Files saved in: {self.teaching_agent.learn_files_dir}/")
            self.show_message(f"   📄 Lessons: {self.teaching_agent.lessons_dir}/")
            self.show_message(f"   🎧 Audio: {self.teaching_agent.audio_dir}/")
            self.show_message(f"   📋 Manifest: {self.teaching_agent.manifest_dir}/")
            
            manifest_file = self.teaching_agent.manifest_dir / f"{session_id}_manifest.json"
            if manifest_file.exists():
                self.show_message(f"\n📋 Manifest saved at: {manifest_file}")
                self.show_message(f"   Contains complete watch order with content types")
            
        except Exception as e:
            self.show_message(f"❌ Error generating course: {e}", "ERROR")
            import traceback
            traceback.print_exc()
    
    # ==================== ASSIGNMENT MODE ====================
    
    async def run_mode_assignment(self):
        """Mode 4: Assignment Layer - Auto-configured by AI"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📝 MODE 4: Assignment Layer")
        
        sessions = self.teaching_agent.list_available_sessions()
        
        if not sessions:
            self.show_message("❌ No sessions with learning plans found.", "WARNING")
            self.show_message("   Please complete a course first (Mode 3).")
            return
        
        available_sessions = []
        for session in sessions:
            session_id = session.get("session_id", "")
            manifest_file = Path(f"learn_files/manifests/{session_id}_manifest.json")
            if manifest_file.exists():
                available_sessions.append(session)
        
        if not available_sessions:
            self.show_message("❌ No completed courses found.", "WARNING")
            self.show_message("   Please generate a course first (Mode 3).")
            return
        
        self.show_message(f"\n📋 Available completed courses for '{username}':")
        self.show_message("-" * 50)
        for i, session in enumerate(available_sessions, 1):
            self.show_message(f"{i}. Topic: {session.get('main_topic', 'Unknown')}")
            self.show_message(f"   Session: {session['session_id'][:20]}...")
            self.show_message(f"   Phases: {session.get('phase_count', 0)}")
            self.show_message(f"   Total Time: {session.get('total_hours', 0)} hours")
            self.show_message("")
        
        choice = self.get_user_input("\n🔍 Select course for assignment")
        if not choice.isdigit():
            self.show_message("❌ Invalid selection.", "WARNING")
            return
        
        idx = int(choice) - 1
        if idx < 0 or idx >= len(available_sessions):
            self.show_message("❌ Invalid session number.", "WARNING")
            return
        
        selected_session = available_sessions[idx]
        session_id = selected_session["session_id"]
        
        self.show_message(f"\n📚 Generating assignment for: {selected_session.get('main_topic', 'Unknown')}")
        self.show_message("\n🧠 AI is analyzing the course to configure the assignment...")
        
        try:
            assignment = await self.assignment_generator.generate_assignment(
                session_id=session_id,
                user_id=user_id
            )
            
            if "error" in assignment:
                self.show_message(f"❌ Error: {assignment['error']}", "ERROR")
                return
            
            config = assignment.get("configuration", {})
            self.show_section("📋 ASSIGNMENT CONFIGURATION (Auto-decided by AI)")
            self.show_message(f"📝 MCQ Questions: {config.get('num_mcq', 5)}")
            self.show_message(f"📝 Written Questions: {config.get('num_written', 2)}")
            self.show_message(f"📊 Difficulty: {config.get('difficulty', 'intermediate').upper()}")
            self.show_message(f"🎯 Passing Score: {config.get('passing_score', 70)}%")
            self.show_message(f"💡 Reasoning: {config.get('reasoning', 'Auto-configured based on course content.')}")
            
            assignment_id = assignment.get("assignment_id", "")
            mcq_questions = assignment.get("questions", {}).get("mcq", [])
            written_questions = assignment.get("questions", {}).get("written", [])
            
            self.show_message(f"\n⏱️ Time Limit: {assignment.get('time_limit_minutes', 0)} minutes")
            self.show_message(f"📝 Total Questions: {len(mcq_questions) + len(written_questions)}")
            
            self.show_section("📌 MULTIPLE CHOICE QUESTIONS")
            
            user_answers = {}
            
            for i, q in enumerate(mcq_questions, 1):
                self.show_message(f"\n{i}. {q.get('question', '')}")
                self.show_message(f"   Topic: {q.get('topic', '')}")
                for j, option in enumerate(q.get('options', [])):
                    self.show_message(f"   {chr(65 + j)}. {option}")
                self.show_message("")
                
                while True:
                    answer = self.get_user_input(f"Your answer ({chr(65)}-{chr(65 + len(q.get('options', [])) - 1)})").upper()
                    if answer and answer in [chr(65 + i) for i in range(len(q.get('options', [])))]:
                        user_answers[q.get('id', f"mcq_{i}")] = ord(answer) - 65
                        break
                    else:
                        self.show_message(f"❌ Invalid. Please enter {chr(65)}-{chr(65 + len(q.get('options', [])) - 1)}", "WARNING")
            
            self.show_section("📌 WRITTEN/ESSAY QUESTIONS")
            
            for i, q in enumerate(written_questions, 1):
                self.show_message(f"\n{i}. {q.get('question', '')}")
                self.show_message(f"   Topic: {q.get('topic', '')}")
                self.show_message(f"   Max Score: {q.get('max_score', 10)}")
                self.show_message("")
                self.show_message("   Enter your answer (type 'skip' to skip this question):")
                answer = self.get_user_input("   Answer")
                
                if answer.lower() == 'skip':
                    user_answers[q.get('id', f"written_{i}")] = ""
                else:
                    user_answers[q.get('id', f"written_{i}")] = answer
            
            self.show_message("\n🔄 Evaluating your answers...")
            
            result = await self.assignment_evaluator.evaluate_assignment(
                assignment_id=assignment_id,
                user_answers=user_answers,
                user_id=user_id
            )
            
            if "error" in result:
                self.show_message(f"❌ Error: {result['error']}", "ERROR")
                return
            
            self.show_section("📊 ASSIGNMENT RESULTS")
            
            total = result.get("scores", {}).get("total", {})
            mcq = result.get("scores", {}).get("mcq", {})
            written = result.get("scores", {}).get("written", {})
            
            self.show_message(f"\n📌 Overall Score: {total.get('percentage', 0)}%")
            self.show_message(f"📊 Grade: {total.get('grade', 'N/A')}")
            self.show_message(f"✅ MCQ: {mcq.get('correct', 0)}/{mcq.get('total', 0)} ({mcq.get('percentage', 0)}%)")
            self.show_message(f"📝 Written: {written.get('score', 0)}/{written.get('total', 0)} ({written.get('percentage', 0)}%)")
            self.show_message(f"🎯 Passing Score: {assignment.get('passing_score', 70)}%")
            status_text = '✅ PASSED' if total.get('percentage', 0) >= assignment.get('passing_score', 70) else '❌ NEEDS REVIEW'
            self.show_message(f"📈 Status: {status_text}")
            
            feedback = result.get("feedback", {})
            self.show_message(f"\n💬 Feedback: {feedback.get('overall', '')}")
            self.show_message(f"📚 Recommendation: {feedback.get('recommendation', '')}")
            
            wrong_answers = result.get("wrong_answers", [])
            if wrong_answers:
                self.show_message("\n❌ Incorrect Answers:")
                for wa in wrong_answers[:3]:
                    if wa.get("type") == "mcq":
                        self.show_message(f"   • {wa.get('question', '')}")
                        self.show_message(f"     Correct: {wa.get('correct_answer', '')}")
                        self.show_message(f"     Your answer: {wa.get('user_answer', '')}")
                        self.show_message(f"     Explanation: {wa.get('explanation', '')}")
                    else:
                        self.show_message(f"   • {wa.get('question', '')}")
                        self.show_message(f"     Score: {wa.get('score', 0)}/{wa.get('max_score', 10)}")
                        self.show_message(f"     Feedback: {wa.get('feedback', '')}")
            
            improvement_areas = result.get("improvement_areas", [])
            if improvement_areas:
                self.show_message("\n📚 Areas for Improvement:")
                for area in improvement_areas[:3]:
                    if "Review:" in area:
                        self.show_message(f"   • {area}")
                    else:
                        self.show_message(f"   • Review: {area}")
            else:
                self.show_message("\n📚 Areas for Improvement:")
                self.show_message("   • No specific areas identified. Great job!")
            
            self.assignment_tracker.save_progress_summary(user_id)
            self.show_message(f"\n💾 Progress saved for user: {username} (ID: {user_id})")
            
        except Exception as e:
            self.show_message(f"❌ Error: {e}", "ERROR")
            import traceback
            traceback.print_exc()
    
    # ==================== PROGRESS MODE ====================
    
    async def run_mode_progress(self):
        """Mode 7: View progress"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📊 PROGRESS TRACKING")
        
        progress = self.assignment_tracker.get_user_progress(user_id)
        
        self.show_message(f"\n📊 Progress for: {username} (ID: {user_id})")
        self.show_message("-" * 40)
        self.show_message(f"📚 Total Assignments: {progress.get('total_assignments', 0)}")
        self.show_message(f"📈 Average Score: {progress.get('average_score', 0)}%")
        self.show_message(f"🏆 Best Score: {progress.get('best_score', 0)}%")
        self.show_message(f"🎯 Latest Score: {progress.get('latest_score', 0)}%")
        self.show_message(f"📊 Latest Grade: {progress.get('latest_grade', 'N/A')}")
        self.show_message(f"📉 Trend: {progress.get('trend', 'Insufficient data')}")
        self.show_message(f"⭐ Performance: {progress.get('performance', 'No data')}")
        
        eligibility = self.assignment_tracker.get_certificate_eligibility(user_id)
        self.show_message(f"\n🎓 Certificate Status: {eligibility.get('status', 'N/A')}")
        if eligibility.get('eligible'):
            self.show_message("   ✅ You are eligible for a certificate!")
        else:
            self.show_message(f"   Requirements: {eligibility.get('requirement', '')}")
        
        history = progress.get("history", [])
        if history:
            self.show_message("\n📋 Recent Assignments:")
            for h in history[:5]:
                date = h.get("evaluated_at", "")[:16] if h.get("evaluated_at") else "Unknown"
                score = h.get("scores", {}).get("total", {}).get("percentage", 0)
                grade = h.get("scores", {}).get("total", {}).get("grade", "N/A")
                self.show_message(f"   • {date}: {score}% ({grade})")
        
        recommendations = progress.get("recommendations", [])
        if recommendations:
            self.show_message("\n💡 Recommendations:")
            for rec in recommendations[:3]:
                self.show_message(f"   • {rec}")
    
    # ==================== TEACHING STATUS ====================
    
    async def run_teaching_status(self):
        """View teaching status for a session"""
        self.show_section("📊 TEACHING STATUS")
        
        session_id = self.get_user_input("\n📎 Enter session ID")
        if not session_id:
            self.show_message("❌ Please enter a session ID.", "WARNING")
            return
        
        status = self.teaching_agent.get_course_status(session_id)
        
        if "error" in status:
            self.show_message(f"❌ {status['error']}", "ERROR")
            return
        
        self.show_message(f"\n📌 Course: {status.get('main_topic', 'Unknown')}")
        self.show_message(f"📝 Total Lessons: {status.get('total_lessons', 0)}")
        self.show_message(f"📄 Text Files: {len(status.get('text_files', []))}")
        self.show_message(f"🎧 Audio Files: {len(status.get('audio_files', []))}")
        
        if status.get('phases'):
            self.show_message("\n📚 Generated Phases:")
            for phase in status['phases']:
                self.show_message(f"   • Phase {phase.get('phase_number')}: {phase.get('phase_title')}")
                self.show_message(f"     Lessons: {len(phase.get('lessons', []))}")
    
    # ==================== MODEL INFO ====================
    
    async def run_model_info(self):
        """Show model information"""
        self.show_section("🤖 OLLAMA MODEL INFO")
        self.show_message(f"\n📌 Model: {self.llm_client.model}")
    
    # ==================== CHANGE MODEL ====================
    
    async def run_mode_change_model(self):
        """Mode: Change Ollama Model with capabilities display"""
        self.show_section("🤖 CHANGE MODEL")
        
        models = self.config.get_available_models()
        
        if not models:
            self.show_message("❌ No models available.", "ERROR")
            return
        
        current_model = self.config.get_model()
        current_desc = self.config.get_model_description(current_model)
        current_caps = self.config.get_model_capabilities(current_model)
        current_type = self.config.get_model_type(current_model)
        
        self.show_message(f"\n📌 Current Model: {current_model}")
        if current_desc:
            self.show_message(f"   Description: {current_desc}")
        self.show_message(f"   Type: {current_type.upper()}")
        self.show_message(f"   Capabilities: {', '.join(current_caps)}")
        
        if self.config.supports_document_scan():
            self.show_message("   📄 Supports Document Scan / OCR")
        
        self.show_section("📋 Available Models")
        
        vision_models = self.config.get_vision_models()
        
        for i, (model_name, description) in enumerate(models, 1):
            is_vision = model_name in vision_models
            marker = "▶ " if model_name == current_model else "  "
            vision_tag = " 🖼️" if is_vision else ""
            
            self.show_message(f"{marker}{i}. {model_name}{vision_tag}")
            if description:
                self.show_message(f"      {description}")
            if is_vision:
                self.show_message(f"      📄 Supports Document Scan / OCR")
        
        self.show_message("\n")
        self.show_message("  🖼️ = Supports Document Scan / OCR")
        self.show_message("  ▶  = Current Model")
        
        choice = self.get_user_input("\n🔍 Enter model number to switch (or press Enter to cancel)")
        
        if not choice:
            self.show_message("❌ Model selection cancelled.", "WARNING")
            return
        
        if not choice.isdigit():
            self.show_message("❌ Invalid choice. Please enter a number.", "ERROR")
            return
        
        idx = int(choice) - 1
        if idx < 0 or idx >= len(models):
            self.show_message("❌ Invalid model number.", "ERROR")
            return
        
        selected_model = models[idx][0]
        selected_desc = models[idx][1]
        is_vision = selected_model in vision_models
        
        self.show_message(f"\n📌 Selected: {selected_model}")
        self.show_message(f"   Description: {selected_desc}")
        if is_vision:
            self.show_message("   📄 Supports Document Scan / OCR")
        else:
            self.show_message("   📄 Text-Only Model (No Document Scan)")
        
        confirm = self.get_user_input("\n🔄 Are you sure you want to switch? (y/n)", "y")
        if confirm.lower() != 'y':
            self.show_message("❌ Model switch cancelled.", "WARNING")
            return
        
        success = self.config.set_model(selected_model)
        if success:
            self.show_message(f"✅ Model changed to: {selected_model}")
            self.show_message("   Restart the application for changes to take full effect.")
            self.llm_client.model = selected_model
            self.show_message("   LLM Client updated with new model.")
        else:
            self.show_message("❌ Failed to change model.", "ERROR")
    
    # ==================== MENTORING LAYER ====================
    
    async def run_mode_mentoring(self):
        """Mode: Mentoring Layer - Chat with AI Mentor"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("🧠 MODE: Mentoring Layer")
        
        self.show_message("\n📋 Select Mentoring Mode:")
        self.show_message("  1. Session Mode (Chat about one specific course)")
        self.show_message("  2. Full Mode (Chat about all your learning)")
        
        mode_choice = self.get_user_input("\nEnter choice (1-2)")
        
        if mode_choice not in ["1", "2"]:
            self.show_message("❌ Invalid choice.", "WARNING")
            return
        
        mode = "session" if mode_choice == "1" else "full"
        
        session_id = None
        session_topic = "All Sessions"
        
        if mode == "session":
            sessions = self.teaching_agent.list_available_sessions()
            
            if not sessions:
                self.show_message("❌ No sessions with learning plans found.", "WARNING")
                self.show_message("   Please complete a course first (Mode 3).")
                return
            
            self.show_message("\n📋 Available courses:")
            self.show_message("-" * 50)
            for i, session in enumerate(sessions, 1):
                self.show_message(f"{i}. Topic: {session.get('main_topic', 'Unknown')}")
                self.show_message(f"   Session: {session['session_id'][:20]}...")
                self.show_message("")
            
            choice = self.get_user_input("\n🔍 Select course to chat about")
            if not choice.isdigit():
                self.show_message("❌ Invalid selection.", "WARNING")
                return
            
            idx = int(choice) - 1
            if idx < 0 or idx >= len(sessions):
                self.show_message("❌ Invalid session number.", "WARNING")
                return
            
            selected = sessions[idx]
            session_id = selected["session_id"]
            session_topic = selected.get("main_topic", "Unknown")
        
        self.show_message(f"\n🧠 Starting mentoring session for: {session_topic}")
        self.show_message(f"📌 Mode: {mode.upper()}")
        self.show_section("", char="=")
        self.show_message("\n💡 You can ask questions about the course content, request explanations,")
        self.show_message("   seek clarification on concepts, or just have a learning conversation.")
        self.show_message("\n   Type 'quit' to end the session.")
        self.show_message("   Type 'clear' to clear conversation history.")
        self.show_message("   Type 'summary' to see a summary of this conversation.")
        self.show_section("", char="=")
        
        conversation_id = None
        
        while True:
            user_input = self.get_user_input("\n👤 You")
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'done']:
                self.show_message("\n👋 Thank you for mentoring! Keep learning!")
                break
            
            if user_input.lower() == 'clear':
                conversation_id = None
                self.show_message("✅ Conversation history cleared. Starting fresh.")
                continue
            
            if user_input.lower() == 'summary':
                if conversation_id:
                    info = self.mentoring_agent.get_conversation_info(conversation_id)
                    if info:
                        self.show_message(f"\n📊 Conversation Summary:")
                        self.show_message(f"   Messages: {info.get('message_count', 0)}")
                        self.show_message(f"   Started: {info.get('created_at', '')[:16]}")
                        self.show_message(f"   Last activity: {info.get('last_accessed', '')[:16]}")
                else:
                    self.show_message("📊 No active conversation yet.")
                continue
            
            self.show_message("\n🧠 Jinvexa Mentor is thinking...")
            
            try:
                result = await self.mentoring_agent.chat(
                    user_id=user_id,
                    message=user_input,
                    conversation_id=conversation_id,
                    session_id=session_id,
                    mode=mode
                )
                
                if "error" in result:
                    self.show_message(f"❌ Error: {result['error']}", "ERROR")
                    continue
                
                conversation_id = result.get("conversation_id")
                response = result.get("response", "I apologize, I couldn't generate a response.")
                
                self.show_message(f"\n🧠 Mentor: {response}")
                
            except Exception as e:
                self.show_message(f"❌ Error: {e}", "ERROR")
                import traceback
                traceback.print_exc()
    
    async def run_mode_mentoring_history(self):
        """View mentoring history"""
        user_id = str(self.current_user_id) if self.current_user_id else "1"
        username = self.current_username or "User"
        
        self.show_section("📋 MENTORING HISTORY")
        
        conversations = self.mentoring_agent.list_conversations(user_id)
        
        if not conversations:
            self.show_message(f"\nNo mentoring conversations found for: {username}")
            return
        
        self.show_message(f"\n📋 Found {len(conversations)} conversations for {username}:")
        self.show_message("-" * 50)
        
        for i, conv in enumerate(conversations, 1):
            self.show_message(f"{i}. {conv.get('topic', 'Unknown')}")
            self.show_message(f"   Mode: {conv.get('mode', 'Unknown').upper()}")
            self.show_message(f"   Messages: {conv.get('message_count', 0)}")
            self.show_message(f"   Last: {conv.get('last_accessed', '')[:16]}")
            self.show_message("")
        
        choice = self.get_user_input("\n🔍 Enter number to continue a conversation")
        if choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(conversations):
                conv = conversations[idx]
                await self._continue_mentoring_conversation(
                    user_id=user_id,
                    conversation_id=str(conv["id"]),
                    session_id=conv.get("session_id"),
                    mode=conv.get("mode", "session")
                )
    
    async def _continue_mentoring_conversation(
        self,
        user_id: str,
        conversation_id: str,
        session_id: str,
        mode: str
    ):
        """Continue an existing mentoring conversation."""
        
        info = self.mentoring_agent.get_conversation_info(conversation_id)
        session_topic = self.mentoring_agent.get_session_topic(session_id)
        username = self.current_username or "User"
        
        self.show_message(f"\n🧠 Continuing mentoring session for: {session_topic}")
        self.show_message(f"📌 Mode: {mode.upper()}")
        self.show_section("", char="=")
        self.show_message("\n💡 Type 'quit' to end the session.")
        self.show_message("   Type 'clear' to clear conversation history.")
        self.show_section("", char="=")
        
        while True:
            user_input = self.get_user_input("\n👤 You")
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'done']:
                self.show_message("\n👋 Thank you for mentoring! Keep learning!")
                break
            
            if user_input.lower() == 'clear':
                conversation_id = None
                self.show_message("✅ Conversation history cleared. Starting fresh.")
                continue
            
            self.show_message("\n🧠 Jinvexa Mentor is thinking...")
            
            try:
                result = await self.mentoring_agent.chat(
                    user_id=user_id,
                    message=user_input,
                    conversation_id=conversation_id,
                    session_id=session_id,
                    mode=mode
                )
                
                if "error" in result:
                    self.show_message(f"❌ Error: {result['error']}", "ERROR")
                    continue
                
                conversation_id = result.get("conversation_id")
                response = result.get("response", "I apologize, I couldn't generate a response.")
                
                self.show_message(f"\n🧠 Mentor: {response}")
                
            except Exception as e:
                self.show_message(f"❌ Error: {e}", "ERROR")
                import traceback
                traceback.print_exc()
    
    # ==================== RUN METHOD ====================
    
    async def run(self):
        """Main run loop - Professional Claude Code style"""
        if not self.display_login():
            return
        
        self.display_banner()

        while True:
            menu_options = [
                {"category": "Discovery", "num": "1", "name": "Goal-Based Learning"},
                {"category": "Discovery", "num": "2", "name": "Reference-Based Learning"},

                {"category": "Creation", "num": "3", "name": "Teaching Layer", "desc": "Generate Course"},
                {"category": "Creation", "num": "4", "name": "Assignment Layer", "desc": "Take Assignment"},

                {"category": "Guidance", "num": "5", "name": "Mentoring Layer", "desc": "Chat with AI Mentor"},
                {"category": "Guidance", "num": "6", "name": "Mentoring History"},

                {"category": "Progress", "num": "7", "name": "View Progress"},
                {"category": "Progress", "num": "8", "name": "View Stats"},
                {"category": "Progress", "num": "9", "name": "View Sessions"},
                {"category": "Progress", "num": "10", "name": "Continue Conversation"},

                {"category": "System", "num": "11", "name": "Teaching Status"},
                {"category": "System", "num": "12", "name": "Model Info"},
                {"category": "System", "num": "13", "name": "Change Model"},
                {"category": "System", "num": "14", "name": "Exit"},
            ]

            self.show_menu(menu_options, "Jinvexa Learning Platform")

            try:
                choice = self.get_user_input("\n  ▶  Enter choice (1-14)")
            except (EOFError, KeyboardInterrupt):
                self.show_message("\n  ✦ Goodbye!", "INFO")
                break

            if choice == "1":
                await self.run_mode_1_goal()
            elif choice == "2":
                await self.run_mode_2_reference()
            elif choice == "3":
                await self.run_mode_teaching()
            elif choice == "4":
                await self.run_mode_assignment()
            elif choice == "5":
                await self.run_mode_mentoring()
            elif choice == "6":
                await self.run_mode_mentoring_history()
            elif choice == "7":
                await self.run_mode_progress()
            elif choice == "8":
                await self.run_show_stats()
            elif choice == "9":
                await self.run_view_sessions()
            elif choice == "10":
                await self._handle_continue_conversation()
            elif choice == "11":
                await self.run_teaching_status()
            elif choice == "12":
                await self.run_model_info()
            elif choice == "13":
                await self.run_mode_change_model()
            elif choice == "14":
                self.show_message("\n  ✦ Thank you for using Jinvexa!", "INFO")
                self.show_message("  ✦ Good luck with your learning journey!", "INFO")
                break
            else:
                self.show_message("  ✘ Invalid choice. Please try again.", "WARNING")


# ==================== MAIN ENTRY POINT ====================

async def main():
    """Main entry point"""
    app = JinvexaApp()
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())