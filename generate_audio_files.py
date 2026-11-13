import os
import re
import urllib.parse
import urllib.request
from pathlib import Path

AUDIO_DIR = Path("frontend/public/audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

MESSAGES = {
    "en": {
        "caseA": "Your image has been classified as benign by our AI model. This does not guarantee that the lesion is harmless. If you notice any changes in its size, shape or colour, or experience bleeding or persistent itching, please consult a dermatologist.",
        "caseB": "The AI model has detected features associated with the malignant category. Please do not panic, but do not ignore this result. Arrange a prompt assessment with a qualified dermatologist. Only a proper medical examination and appropriate tests can determine what the lesion actually is.",
        "caseC": "Sorry, we could not reliably assess this image. Please upload a clear dermoscopic skin-lesion image. If you are concerned about a skin change, please consult a dermatologist rather than relying on this result.",
    },
    "te": {
        "caseA": "ఈ చిత్రాన్ని మా AI మోడల్ బెనైన్ (హానిచేయనిది) గా వర్గీకరించింది. అయితే దీని వల్ల మచ్చ పూర్తిగా ప్రమాదకరం కాదని హామీ ఇవ్వలేము. దీని పరిమాణం, ఆకారం లేదా రంగులో ఏవైనా మార్పులు గమనించినా, లేదా రక్తం కారడం, నిరంతర దురద ఉన్నా దయచేసి చర్మవ్యాధి నిపుణుడిని సంప్రదించండి.",
        "caseB": "AI మోడల్ ఈ మచ్చలో మాలిగ్నెంట్ (ప్రమాదకర) వర్గానికి సంబంధించిన లక్షణాలను గుర్తించింది. దయచేసి ఆందోళన చెందవద్దు, కానీ ఈ ఫలితాన్ని నిర్లక్ష్యం చేయకండి. వెంటనే అర్హత కలిగిన చర్మవ్యాధి నిపుణుడితో పరీక్ష చేయించుకోండి. సరైన వైద్య పరీక్షల ద్వారా మాత్రమే ఇది ఏమిటో నిర్ధారించగలరు.",
        "caseC": "క్షమించండి, మేము ఈ చిత్రాన్ని ఖచ్చితంగా విశ్లేషించలేకపోయాము. దయచేసి స్పష్టమైన డెర్మోస్కోపిక్ చర్మ మచ్చ చిత్రాన్ని అప్‌లోడ్ చేయండి. మీ చర్మ మచ్చ గురించి ఏవైనా సందేహాలు ఉంటే, ఈ ఫలితంపై ఆధారపడకుండా వెంటనే చర్మవ్యాధి నిపుణుడిని సంప్రదించండి.",
    },
    "kn": {
        "caseA": "ನಮ್ಮ AI ಮಾದರಿಯು ಈ ಚಿತ್ರವನ್ನು ಬೆನೈನ್ (ಹಾನಿಕಾರಕವಲ್ಲದ್ದು) ಎಂದು ವರ್ಗೀಕರಿಸಿದೆ. ಆದರೆ ಇದು ಗಾಯವು ಸಂಪೂರ್ಣವಾಗಿ ಅಪಾಯವಿಲ್ಲದ್ದು ಎಂದು ಖಾತರಿ ನೀಡುವುದಿಲ್ಲ. ಇದರ ಗಾತ್ರ, ಆಕಾರ ಅಥವಾ ಬಣ್ಣದಲ್ಲಿ ಯಾವುದೇ ಬದಲಾವಣೆ ಕಂಡುಬಂದರೆ, ಅಥವಾ ರಕ್ತಸ್ರಾವ ಮತ್ತು ನಿರಂತರ ತುರಿಕೆ ಇದ್ದರೆ, ದಯವಿಟ್ಟು ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        "caseB": "AI ಮಾದರಿಯು ಮ್ಯಾಲಿಗ್ನೆಂಟ್ (ಅಪಾಯಕಾರಿ) ವರ್ಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಲಕ್ಷಣಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿದೆ. ದಯವಿಟ್ಟು ಭಯಪಡಬೇಡಿ, ಆದರೆ ಈ ಫಲಿತಾಂಶವನ್ನು ನಿರ್ಲಕ್ಷಿಸಬೇಡಿ. ಶೀಘ್ರದಲ್ಲೇ ಅರ್ಹ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ. ಸರಿಯಾದ ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಮತ್ತು ತಪಾಸಣೆಗಳಿಂದ ಮಾತ್ರ ಗಾಯದ ನೈಜ ಸ್ವರೂಪವನ್ನು ನಿರ್ಧರಿಸಲು ಸಾಧ್ಯ.",
        "caseC": "ಕ್ಷಮಿಸಿ, ಈ ಚಿತ್ರವನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ನಿರ್ಣಯಿಸಲು ನಮಗೆ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಡರ್ಮೋಸ್ಕೋಪಿಕ್ ಚರ್ಮದ ಗಾಯದ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಚರ್ಮದ ಬದಲಾವಣೆಯ ಬಗ್ಗೆ ನಿಮಗೆ ಕಾಳಜಿ ಇದ್ದರೆ, ಈ ಫಲಿತಾಂಶವನ್ನು ಅವಲಂಬಿಸದೆ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    },
    "hi": {
        "caseA": "हमारे AI मॉडल ने इस छवि को बिनाइन (हानिरहित) के रूप में वर्गीकृत किया है। हालांकि, यह इस बात की गारंटी नहीं देता कि यह पूरी तरह सुरक्षित है। यदि आप इसके आकार, रंग या रूप में कोई बदलाव देखते हैं, या इसमें खून बहना या लगातार खुजली होती है, तो कृपया त्वचा विशेषज्ञ से परामर्श लें।",
        "caseB": "AI मॉडल ने मैलिग्नेंट (घातक/संदिग्ध) श्रेणी से जुड़े लक्षणों का पता लगाया है। कृपया घबराएं नहीं, लेकिन इस परिणाम को अनदेखा भी न करें। जल्द से जल्द किसी योग्य त्वचा विशेषज्ञ से जांच करवाएं। केवल उचित चिकित्सकीय जांच और टेस्ट ही यह तय कर सकते हैं कि यह वास्तव में क्या है।",
        "caseC": "क्षमा करें, हम इस छवि का सटीक मूल्यांकन नहीं कर सके। कृपया एक स्पष्ट डर्मोस्कोपिक त्वचा घाव की छवि अपलोड करें। यदि आप त्वचा में किसी बदलाव को लेकर चिंतित हैं, तो इस परिणाम पर निर्भर रहने के बजाय किसी त्वचा विशेषज्ञ से परामर्श लें।",
    },
    "ta": {
        "caseA": "இந்த படத்தை எங்கள் AI மாதிரி தீங்கற்றதாக வகைப்படுத்தியுள்ளது. இருப்பினும், இந்த தழும்பு முற்றிலும் ஆபத்தற்றது என்று இது உத்தரவாதம் அளிக்காது. இதன் அளவு, வடிவம் அல்லது நிறத்தில் ஏதேனும் மாற்றங்கள் ஏற்பட்டாலோ, அல்லது இரத்தப்போக்கு, தொடர் அரிப்பு இருந்தாலோ தயவுசெய்து தோல் மருத்துவரை அணுகவும்.",
        "caseB": "இந்த தழும்பில் வீரியமிக்க வகையுடன் தொடர்புடைய அம்சங்களை AI மாதிரி கண்டறிந்துள்ளது. தயவுசெய்து பீதியடைய வேண்டாம், ஆனால் இந்த முடிவை புறக்கணிக்காதீர்கள். உடனடியாக ஒரு தகுதிவாய்ந்த தோல் மருத்துவரை சந்தித்து பரிசோதனை செய்துகொள்ளுங்கள். முறையான மருத்துவ பரிசோதனைகள் மட்டுமே இதன் உண்மை நிலையை உறுதிப்படுத்த முடியும்.",
        "caseC": "மன்னிக்கவும், இந்த படத்தை எங்களால் துல்லியமாக மதிப்பீடு செய்ய முடியவில்லை. தயவுசெய்து தெளிவான டெர்மோஸ்கோபிக் தோல் தழும்பு படத்தை பதிவேற்றவும். உங்கள் தோலில் ஏதேனும் மாற்றம் குறித்து கவலை இருந்தால், இந்த முடிவை நம்பாமல் உடனடியாக ஒரு தோல் மருத்துவரை அணுகவும்.",
    },
}

def split_into_chunks(text, max_len=140):
    sentences = re.split(r'([.!?,।\n]+)', text)
    chunks = []
    current = ""
    for s in sentences:
        if len(current + s) <= max_len:
            current += s
        else:
            if current.strip():
                chunks.append(current.strip())
            current = s
    if current.strip():
        chunks.append(current.strip())
    return chunks or [text]

def fetch_chunk_audio(chunk, lang):
    encoded = urllib.parse.quote(chunk)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded}&tl={lang}&client=tw-ob"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp:
        return resp.read()

def main():
    print("Generating authentic native audio files for all languages...")
    for lang, cases in MESSAGES.items():
        for case_name, text in cases.items():
            out_file = AUDIO_DIR / f"{lang}_{case_name}.mp3"
            print(f"Generating {out_file.name} for {lang}...")
            chunks = split_into_chunks(text)
            full_audio = b""
            for c in chunks:
                audio_bytes = fetch_chunk_audio(c, lang)
                full_audio += audio_bytes
            with open(out_file, "wb") as f:
                f.write(full_audio)
            print(f"✓ Saved {out_file.name} ({len(full_audio)} bytes)")
    print("All 15 multilingual audio files successfully generated!")

if __name__ == "__main__":
    main()

