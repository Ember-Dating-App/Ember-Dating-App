"""Utility functions for language handling"""

# Common language codes
LANGUAGE_CODES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'tr': 'Turkish',
    'el': 'Greek',
    'he': 'Hebrew',
    'uk': 'Ukrainian',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian'
}

def get_language_name(code: str) -> str:
    """Get language name from code"""
    return LANGUAGE_CODES.get(code, code.upper())

def get_popular_languages() -> list:
    """Get list of most popular languages for dating apps"""
    return [
        {'code': 'en', 'name': 'English'},
        {'code': 'es', 'name': 'Spanish'},
        {'code': 'fr', 'name': 'French'},
        {'code': 'de', 'German'},
        {'code': 'it', 'name': 'Italian'},
        {'code': 'pt', 'name': 'Portuguese'},
        {'code': 'ru', 'name': 'Russian'},
        {'code': 'ja', 'name': 'Japanese'},
        {'code': 'ko', 'name': 'Korean'},
        {'code': 'zh-cn', 'name': 'Chinese'},
        {'code': 'ar', 'name': 'Arabic'},
        {'code': 'hi', 'name': 'Hindi'},
        {'code': 'th', 'name': 'Thai'},
        {'code': 'vi', 'name': 'Vietnamese'},
        {'code': 'pl', 'name': 'Polish'},
        {'code': 'nl', 'name': 'Dutch'},
        {'code': 'tr', 'name': 'Turkish'}
    ]
