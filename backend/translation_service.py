"""Translation service for automatic message translation"""
import os
import logging
from typing import Dict, Optional
from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

class TranslationService:
    """Service for translating messages between users"""
    
    def __init__(self):
        self.enabled = os.getenv('TRANSLATION_ENABLED', 'true').lower() == 'true'
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = int(os.getenv('TRANSLATION_CACHE_TTL', '86400'))
        try:
            self.supported_languages = GoogleTranslator().get_supported_languages(as_dict=True)
        except:
            self.supported_languages = {}
        
    def is_enabled(self) -> bool:
        """Check if translation is enabled"""
        return self.enabled
    
    def detect_language(self, text: str) -> str:
        """Detect the language of text"""
        try:
            if not text or not text.strip():
                return 'en'
            
            detected = detect(text)
            return detected if detected else 'en'
        except (LangDetectException, Exception) as e:
            logger.error(f"Language detection failed: {e}")
            return 'en'
    
    def translate_text(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        """Translate text from source to target language"""
        try:
            # Skip if same language
            if source_lang == target_lang:
                return text
            
            # Check cache
            cache_key = f"{text}_{source_lang}_{target_lang}"
            if cache_key in self.cache:
                return self.cache[cache_key]
            
            # Translate
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated_text = translator.translate(text)
            
            # Cache the result
            self.cache[cache_key] = translated_text
            
            return translated_text
            
        except Exception as e:
            logger.error(f"Translation failed from {source_lang} to {target_lang}: {e}")
            return None
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get all supported languages"""
        return self.supported_languages
    
    def translate_if_needed(self, text: str, sender_lang: str, receiver_lang: str) -> Dict[str, any]:
        """Translate message only if languages differ"""
        result = {
            'original_text': text,
            'original_language': sender_lang,
            'translated_text': text,
            'target_language': receiver_lang,
            'was_translated': False
        }
        
        if not self.enabled:
            return result
        
        # Only translate if languages are different
        if sender_lang != receiver_lang:
            translated = self.translate_text(text, sender_lang, receiver_lang)
            if translated:
                result['translated_text'] = translated
                result['was_translated'] = True
        
        return result

# Global instance
translation_service = TranslationService()
