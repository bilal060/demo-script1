async function testTranslation() {
    const fetch = (await import('node-fetch')).default;
    const testText = "📅 Мэдээлэл шинэчлэлтийн эх үүсвэр!📢";
    
    try {
        console.log('Testing translation API...');
        console.log('Original text:', testText);
        
        const response = await fetch('https://script-mtb6e9o7j-t6765bilsls-projects.vercel.app/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: testText,
                sourceLang: 'mn',
                targetLang: 'en'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Translation successful!');
            console.log('Translated text:', data.translatedText);
            console.log('Detected language:', data.detectedLanguage);
        } else {
            console.log('❌ Translation failed:');
            console.log('Status:', response.status);
            console.log('Error:', data.error || data.message);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testTranslation(); 