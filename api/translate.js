import fetch from 'node-fetch';

// LibreTranslate API configuration
const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';

// Language mapping for better detection
const LANGUAGE_MAP = {
  // Mongolian variants
  'mn': 'Mongolian (Cyrillic)',
  'mn-Cyrl': 'Mongolian (Cyrillic)',
  'mn-Latn': 'Mongolian (Latin)',
  'mn-Mong': 'Mongolian (Traditional)',
  
  // Korean
  'ko': 'Korean',
  
  // Chinese variants
  'zh': 'Chinese (Simplified)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'zh-HK': 'Chinese (Hong Kong)',
  
  // Other common languages
  'ja': 'Japanese',
  'ru': 'Russian',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  'vi': 'Vietnamese'
};

// Simple language detection based on character sets
function detectLanguage(text) {
  if (!text) return 'auto';
  
  const hasMongolian = /[\u1800-\u18AF]/.test(text); // Mongolian Unicode range
  const hasKorean = /[\uAC00-\uD7AF]/.test(text); // Korean Unicode range
  const hasChinese = /[\u4E00-\u9FFF]/.test(text); // Chinese Unicode range
  const hasCyrillic = /[\u0400-\u04FF]/.test(text); // Cyrillic Unicode range
  
  if (hasMongolian) return 'mn';
  if (hasKorean) return 'ko';
  if (hasChinese) return 'zh';
  if (hasCyrillic) return 'mn'; // Assume Mongolian Cyrillic
  
  return 'auto';
}

async function translateText(text, sourceLang = 'auto', targetLang = 'en') {
  try {
    if (!text || text.trim().length === 0) {
      return { error: 'No text provided for translation' };
    }

    // Auto-detect language if not specified
    if (sourceLang === 'auto') {
      sourceLang = detectLanguage(text);
    }

    console.log(`Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 50)}..."`);

    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Translation error: ${data.error}`);
    }

    return {
      originalText: text,
      translatedText: data.translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      detectedLanguage: data.detected?.confidence ? data.detected.language : sourceLang,
      confidence: data.detected?.confidence || null
    };

  } catch (error) {
    console.error('Translation error:', error);
    return {
      error: error.message,
      originalText: text,
      translatedText: null
    };
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { text, sourceLang = 'auto', targetLang = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    const result = await translateText(text, sourceLang, targetLang);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({
      error: 'Internal server error during translation',
      message: error.message
    });
  }
} 