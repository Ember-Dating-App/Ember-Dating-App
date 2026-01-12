import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API } from '../App';
import { toast } from 'sonner';

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-cn', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' }
];

const LanguageSelector = ({ isOpen, onClose, currentLanguage, onLanguageChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('ember_token')}`
      };

      await axios.put(
        `${API}/profile/language?language=${selectedLanguage}`,
        {},
        { headers }
      );

      onLanguageChange(selectedLanguage);
      toast.success('Language updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="w-6 h-6 text-primary" />
            Select Your Language
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Messages will be automatically translated to your preferred language
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[500px] pr-2">
          <div className="grid grid-cols-2 gap-3 mt-4">
            {POPULAR_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                  ${selectedLanguage === lang.code
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-muted-foreground">{lang.code}</div>
                </div>
                {selectedLanguage === lang.code && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 ember-gradient ember-glow"
          >
            {saving ? 'Saving...' : 'Save Language'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelector;
