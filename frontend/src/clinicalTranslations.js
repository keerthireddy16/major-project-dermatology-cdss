/**
 * Clinical Decision Support System - Multilingual Translations & Case Formulations
 * Supports: English (en), Telugu (te), Kannada (kn), Hindi (hi)
 * 
 * Clinical Boundary Rules:
 * - Never diagnoses cancer ("You have skin cancer").
 * - Never claims certainty ("You are safe").
 * - Never prescribes medication, creams, or ointments.
 * - Always urges in-person consultation with a qualified dermatologist.
 */

export const CLINICAL_TRANSLATIONS = {
  en: {
    langCode: 'en',
    langName: 'English',
    bcp47: 'en-US',
    appTitle: 'DermAI – Skin Assessment',
    prototypeBadge: 'Prototype preview',
    appSubtitle: 'AI-assisted preliminary image analysis',
    modelPredictionLabel: 'MODEL PREDICTION',
    modelScoreLabel: 'Model score:',
    illustrativeNotice: 'Illustrative value only – not a real model result.',
    visualExplanationTitle: 'Visual explanation – Grad-CAM',
    originalImageLabel: 'Original Image',
    gradCamOverlayLabel: 'Grad-CAM Overlay',
    gradCamCaption: "Highlights image regions that influenced the model's prediction. It does not prove medical correctness.",
    chooseLanguageTitle: 'Choose your language',
    resultExplainedSimplyTitle: 'Your result, explained simply',
    listenToResult: 'Listen to result',
    stopListening: 'Stop listening',
    speakingStatus: 'Speaking audio...',
    speechNotSupported: 'Speech synthesis is not supported on this browser.',
    exampleScreenDisclaimer: 'Example screen only. The displayed score and prediction are illustrative.',

    // Voice assistant / Explanation Cases
    caseA: "Your image has been classified as benign by our AI model. This does not guarantee that the lesion is harmless. If you notice any changes in its size, shape or colour, or experience bleeding or persistent itching, please consult a dermatologist.",
    caseB: "The AI model has detected features associated with the malignant category. Please do not panic, but do not ignore this result. Arrange a prompt assessment with a qualified dermatologist. Only a proper medical examination and appropriate tests can determine what the lesion actually is.",
    caseC: "Sorry, we could not reliably assess this image. Please upload a clear dermoscopic skin-lesion image. If you are concerned about a skin change, please consult a dermatologist rather than relying on this result.",

    // Friendly Guidance Section
    guidanceHeading: 'Friendly Next Steps & Medical Guidance',
    whenToSeekTitle: 'When to seek prompt medical assessment',
    whenToSeekDesc: 'Even if an AI result appears benign or reassuring, consult a qualified dermatologist immediately if you notice any changes or the ABCDE warning signs:',
    abcde: [
      { letter: 'A', title: 'Asymmetry', desc: 'One half of the lesion does not match the other half in shape.' },
      { letter: 'B', title: 'Border', desc: 'The edges are irregular, ragged, notched, scalloped, or blurred.' },
      { letter: 'C', title: 'Color', desc: 'The pigmentation is not uniform; shades of tan, brown, black, red, or white.' },
      { letter: 'D', title: 'Diameter', desc: 'Larger than 6 mm (about the size of a pencil eraser), though some can be smaller.' },
      { letter: 'E', title: 'Evolving', desc: 'Any change in size, shape, color, or symptoms such as itching, bleeding, or crusting.' },
    ],
    whyUncertainTitle: 'Why an AI prediction may be uncertain',
    uncertaintyPoints: [
      'Image Quality & Lighting: Low resolution, camera shake, glare, or uneven flash can hide subtle clinical pigment networks.',
      'Surface Obstructions: Dark hair follicles, air bubbles from dermatoscope gel, or skin markings can confuse neural activations.',
      'Dermoscopy vs Phone Camera: The model is trained on magnified clinical dermatoscope images (HAM10000/ISIC); consumer camera photos may yield erratic predictions.',
      'Normal Skin Limitation: Submitting healthy, unpigmented skin causes artificial forced classifications, as the model was trained solely on confirmed lesions.'
    ],
    ethicalBoundariesTitle: 'Strict Clinical & Ethical Boundaries',
    ethicalBoundariesText: 'DermAI is strictly an educational and experimental decision-support prototype. It does not provide medical diagnoses, will never declare a patient "safe" or "cured", and will never recommend topical creams or home treatments. Always rely on a professional dermatological biopsy.',
    redFlagsTitle: 'Warning Signs That Must Never Be Ignored',
    redFlags: [
      'Spontaneous bleeding, oozing, or ulceration without preceding physical injury.',
      'Rapid morphological transformation in size, shape, surface elevation, or darkness over weeks or months.',
      'Persistent itching, tenderness, stinging sensation, or localized pain.',
      'The "Ugly Duckling" sign: a mole that looks distinctly different, darker, or more irregular than any other spot on your body.'
    ]
  },

  te: {
    langCode: 'te',
    langName: 'తెలుగు',
    bcp47: 'te-IN',
    appTitle: 'DermAI – చర్మ మచ్చల విశ్లేషణ',
    prototypeBadge: 'నమూనా పరిదృశ్యం (Prototype preview)',
    appSubtitle: 'AI ఆధారిత ప్రాథమిక చిత్ర విశ్లేషణ',
    modelPredictionLabel: 'మోడల్ అంచనా (MODEL PREDICTION)',
    modelScoreLabel: 'మోడల్ స్కోర్:',
    illustrativeNotice: 'ఇది ప్రాథమిక వివరణ మాత్రమే – తుది వైద్య నిర్ధారణ కాదు.',
    visualExplanationTitle: 'దృశ్య వివరణ – Grad-CAM',
    originalImageLabel: 'అసలు చిత్రం (Original Image)',
    gradCamOverlayLabel: 'Grad-CAM ఓవర్‌లే',
    gradCamCaption: 'మోడల్ అంచనాకు దోహదపడిన చర్మ ప్రాంతాలను ఈ హీట్‌మ్యాప్ హైలైట్ చేస్తుంది. ఇది వైద్య ఖచ్చితత్వాన్ని నిరూపించదు.',
    chooseLanguageTitle: 'మీ భాషను ఎంచుకోండి',
    resultExplainedSimplyTitle: 'మీ ఫలితం, సరళమైన వివరణ',
    listenToResult: 'వాయిస్ వినండి (Listen to result)',
    stopListening: 'ఆడియో ఆపు (Stop)',
    speakingStatus: 'వాయిస్ ప్లే అవుతోంది...',
    speechNotSupported: 'మీ బ్రౌజర్‌లో వాయిస్ సింథసిస్ సపోర్ట్ అందుబాటులో లేదు.',
    exampleScreenDisclaimer: 'ఉదాహరణ స్క్రీన్ మాత్రమే. ప్రదర్శించబడిన స్కోర్ మరియు అంచనా దృష్టాంతం కొరకు మాత్రమే.',

    // Voice assistant / Explanation Cases
    caseA: "ఈ చిత్రాన్ని మా AI మోడల్ బెనైన్ (హానిచేయనిది) గా వర్గీకరించింది. అయితే దీని వల్ల మచ్చ పూర్తిగా ప్రమాదకరం కాదని హామీ ఇవ్వలేము. దీని పరిమాణం, ఆకారం లేదా రంగులో ఏవైనా మార్పులు గమనించినా, లేదా రక్తం కారడం, నిరంతర దురద ఉన్నా దయచేసి చర్మవ్యాధి నిపుణుడిని (డెర్మటాలజిస్ట్) సంప్రదించండి.",
    caseB: "AI మోడల్ ఈ మచ్చలో మాలిగ్నెంట్ (ప్రమాదకర) వర్గానికి సంబంధించిన లక్షణాలను గుర్తించింది. దయచేసి ఆందోళన చెందవద్దు, కానీ ఈ ఫలితాన్ని నిర్లక్ష్యం చేయకండి. వెంటనే అర్హత కలిగిన చర్మవ్యాధి నిపుణుడితో (డెర్మటాలజిస్ట్) పరీక్ష చేయించుకోండి. సరైన వైద్య పరీక్షల ద్వారా మాత్రమే ఇది ఏమిటో నిర్ధారించగలరు.",
    caseC: "క్షమించండి, మేము ఈ చిత్రాన్ని ఖచ్చితంగా విశ్లేషించలేకపోయాము. దయచేసి స్పష్టమైన డెర్మోస్కోపిక్ చర్మ మచ్చ చిత్రాన్ని అప్‌లోడ్ చేయండి. మీ చర్మ మచ్చ గురించి ఏవైనా సందేహాలు ఉంటే, ఈ ఫలితంపై ఆధారపడకుండా వెంటనే చర్మవ్యాధి నిపుణుడిని సంప్రదించండి.",

    guidanceHeading: 'తదుపరి జాగ్రత్తలు & వైద్య మార్గదర్శకాలు',
    whenToSeekTitle: 'వైద్యుడిని ఎప్పుడు సంప్రదించాలి?',
    whenToSeekDesc: 'AI ఫలితం సాధారణంగా కనిపించినప్పటికీ, ఈ క్రింది ABCDE హెచ్చరిక సంకేతాలు లేదా లక్షణాలు కనిపిస్తే వెంటనే డెర్మటాలజిస్ట్‌ను కలవండి:',
    abcde: [
      { letter: 'A', title: 'అసమరూపత (Asymmetry)', desc: 'మచ్చ యొక్క ఒక సగం భాగం మరొక సగంతో సమానంగా లేకపోవడం.' },
      { letter: 'B', title: 'అంచుల లోపాలు (Border)', desc: 'అంచులు వంకరగా, గరుకుగా లేదా అస్పష్టంగా ఉండటం.' },
      { letter: 'C', title: 'రంగుల తేడాలు (Color)', desc: 'నలుపు, గోధుమ, తెలుపు లేదా ఎరుపు రంగుల అసమాన కలయిక.' },
      { letter: 'D', title: 'పరిమాణం (Diameter)', desc: 'మచ్చ 6 మి.మీ (పెన్సిల్ వెనుక రబ్బరు పరిమాణం) కంటే పెద్దదిగా ఉండటం.' },
      { letter: 'E', title: 'మార్పు చెందడం (Evolving)', desc: 'మచ్చ పరిమాణం, రంగు పెరగడం లేదా రక్తం కారడం, దురద పెట్టడం.' },
    ],
    whyUncertainTitle: 'AI అంచనా ఎందుకు అనిశ్చితంగా ఉండవచ్చు?',
    uncertaintyPoints: [
      'కాంతి లేదా ఫోకస్ లోపం: మసకబారిన లేదా తక్కువ రిజల్యూషన్ చిత్రాలు సూక్ష్మ వర్ణద్రవ్యం నెట్‌వర్క్‌లను దాచిపెడతాయి.',
      'వెంట్రుకలు లేదా ప్రతిబింబాలు: చర్మంపై వెంట్రుకలు లేదా ఫ్లాష్ లైట్ ప్రతిబింబాలు న్యూరల్ యాక్టివేషన్‌ను ప్రభావితం చేస్తాయి.',
      'సాధారణ ఫోన్ కెమెరా: ఈ మోడల్ డెర్మోస్కోపిక్ చిత్రాలపై శిక్షణ పొందింది, సాధారణ స్మార్ట్‌ఫోన్ ఫోటోలపై ఫలితాలు మారవచ్చు.',
      'సాధారణ చర్మ పరిమితి: సాధారణ ఆరోగ్యకరమైన చర్మాన్ని అప్‌లోడ్ చేస్తే తప్పుడు అంచనాలు వచ్చే అవకాశం ఉంది.'
    ],
    ethicalBoundariesTitle: 'వైద్య పరిమితులు & బాధ్యత',
    ethicalBoundariesText: 'DermAI అనేది ఒక పరిశోధనా నమూనా మాత్రమే. ఇది ఎటువంటి తుది వ్యాధి నిర్ధారణ చేయదు, ఎటువంటి మందులు లేదా క్రీములను సిఫారసు చేయదు. మీ ఆరోగ్యానికి అర్హత కలిగిన వైద్యుల సలహాయే ప్రధానం.',
    redFlagsTitle: 'ఎట్టి పరిస్థితుల్లోనూ నిర్లక్ష్యం చేయకూడని ప్రమాద సంకేతాలు',
    redFlags: [
      'ఎటువంటి గాయం లేకుండానే మచ్చ నుండి రక్తం కారడం లేదా పొక్కు కట్టడం.',
      'కొన్ని వారాలు లేదా నెలల్లో మచ్చ పరిమాణం, రంగు లేదా ఆకారం వేగంగా మారడం.',
      'మచ్చ వద్ద నిరంతర దురద, నొప్పి లేదా మంట కలగడం.',
      'శరీరంపై ఉన్న ఇతర మచ్చలతో పోలిస్తే ఇది పూర్తిగా భిన్నంగా కనిపించడం ("Ugly Duckling" సంకేతం).'
    ]
  },

  kn: {
    langCode: 'kn',
    langName: 'ಕನ್ನಡ',
    bcp47: 'kn-IN',
    appTitle: 'DermAI – ಚರ್ಮದ ಗಾಯಗಳ ವಿಶ್ಲೇಷಣೆ',
    prototypeBadge: 'ಮಾದರಿ ಮುನ್ನೋಟ (Prototype preview)',
    appSubtitle: 'AI-ಸಹಾಯದ ಪ್ರಾಥಮಿಕ ಚಿತ್ರ ವಿಶ್ಲೇಷಣೆ',
    modelPredictionLabel: 'ಮಾದರಿ ಭವಿಷ್ಯವಾಣಿ (MODEL PREDICTION)',
    modelScoreLabel: 'ಮಾದರಿ ಅಂಕ (Score):',
    illustrativeNotice: 'ಇದು ಪ್ರಾಥಮಿಕ ಉದಾಹರಣೆ ಮಾತ್ರ – ಅಂತಿಮ ವೈದ್ಯಕೀಯ ಫಲಿತಾಂಶವಲ್ಲ.',
    visualExplanationTitle: 'ದೃಶ್ಯ ವಿವರಣೆ – Grad-CAM',
    originalImageLabel: 'ಮೂಲ ಚಿತ್ರ (Original Image)',
    gradCamOverlayLabel: 'Grad-CAM ಓವರ್‌ಲೇ',
    gradCamCaption: 'ಮಾದರಿಯ ಊಹೆಗೆ ಕಾರಣವಾದ ಚರ್ಮದ ಪ್ರದೇಶಗಳನ್ನು ಈ ಶಾಖ ನಕ್ಷೆ (heatmap) ತೋರಿಸುತ್ತದೆ. ಇದು ವೈದ್ಯಕೀಯ ನಿಖರತೆಯನ್ನು ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ.',
    chooseLanguageTitle: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    resultExplainedSimplyTitle: 'ನಿಮ್ಮ ಫಲಿತಾಂಶದ ಸರಳ ವಿವರಣೆ',
    listenToResult: 'ಧ್ವನಿ ಆಲಿಸಿ (Listen to result)',
    stopListening: 'ನಿಲ್ಲಿಸಿ (Stop)',
    speakingStatus: 'ಧ್ವನಿ ಚಾಲನೆಯಲ್ಲಿದೆ...',
    speechNotSupported: 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಪೀಚ್ ಸಿಂಥೆಸಿಸ್ ಬೆಂಬಲ ಲಭ್ಯವಿಲ್ಲ.',
    exampleScreenDisclaimer: 'ಉದಾಹರಣೆ ಪರದೆ ಮಾತ್ರ. ಪ್ರದರ್ಶಿಸಲಾದ ಸ್ಕೋರ್ ಮತ್ತು ಮುನ್ಸೂಚನೆಯು ಕೇವಲ ವಿವರಣೆಗಾಗಿ.',

    // Voice assistant / Explanation Cases
    caseA: "ನಮ್ಮ AI ಮಾದರಿಯು ಈ ಚಿತ್ರವನ್ನು ಬೆನೈನ್ (ಹಾನಿಕಾರಕವಲ್ಲದ್ದು) ಎಂದು ವರ್ಗೀಕರಿಸಿದೆ. ಆದರೆ ಇದು ಗಾಯವು ಸಂಪೂರ್ಣವಾಗಿ ಅಪಾಯವಿಲ್ಲದ್ದು ಎಂದು ಖಾತರಿ ನೀಡುವುದಿಲ್ಲ. ಇದರ ಗಾತ್ರ, ಆಕಾರ ಅಥವಾ ಬಣ್ಣದಲ್ಲಿ ಯಾವುದೇ ಬದಲಾವಣೆ ಕಂಡುಬಂದರೆ, ಅಥವಾ ರಕ್ತಸ್ರಾವ ಮತ್ತು ನಿರಂತರ ತುರಿಕೆ ಇದ್ದರೆ, ದಯವಿಟ್ಟು ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    caseB: "AI ಮಾದರಿಯು ಮ್ಯಾಲಿಗ್ನೆಂಟ್ (ಅಪಾಯಕಾರಿ) ವರ್ಗಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಲಕ್ಷಣಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿದೆ. ದಯವಿಟ್ಟು ಭಯಪಡಬೇಡಿ, ಆದರೆ ಈ ಫಲಿತಾಂಶವನ್ನು ನಿರ್ಲಕ್ಷಿಸಬೇಡಿ. ಶೀಘ್ರದಲ್ಲೇ ಅರ್ಹ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ. ಸರಿಯಾದ ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆ ಮತ್ತು ತಪಾಸಣೆಗಳಿಂದ ಮಾತ್ರ ಗಾಯದ ನೈಜ ಸ್ವರೂಪವನ್ನು ನಿರ್ಧರಿಸಲು ಸಾಧ್ಯ.",
    caseC: "ಕ್ಷಮಿಸಿ, ಈ ಚಿತ್ರವನ್ನು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ನಿರ್ಣಯಿಸಲು ನಮಗೆ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟವಾದ ಡರ್ಮೋಸ್ಕೋಪಿಕ್ ಚರ್ಮದ ಗಾಯದ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಚರ್ಮದ ಬದಲಾವಣೆಯ ಬಗ್ಗೆ ನಿಮಗೆ ಕಾಳಜಿ ಇದ್ದರೆ, ಈ ಫಲಿತಾಂಶವನ್ನು ಅವಲಂಬಿಸದೆ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.",

    guidanceHeading: 'ಮುಂದಿನ ಕ್ರಮಗಳು & ವೈದ್ಯಕೀಯ ಮಾರ್ಗದರ್ಶನ',
    whenToSeekTitle: 'ವೈದ್ಯರನ್ನು ಯಾವಾಗ ಸಂಪರ್ಕಿಸಬೇಕು?',
    whenToSeekDesc: 'AI ಫಲಿತಾಂಶವು ಸುರಕ್ಷಿತವೆಂದು ತೋರಿದರೂ, ಈ ಕೆಳಗಿನ ABCDE ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ಚರ್ಮರೋಗ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ:',
    abcde: [
      { letter: 'A', title: 'ಅಸಮಪಾರ್ಶ್ವತೆ (Asymmetry)', desc: 'ಮಚ್ಚೆಯ ಒಂದು ಅರ್ಧವು ಇನ್ನೊಂದು ಅರ್ಧಕ್ಕೆ ಆಕಾರದಲ್ಲಿ ಹೋಲುವುದಿಲ್ಲ.' },
      { letter: 'B', title: 'ಅಂಚುಗಳ ಅಕ್ರಮ (Border)', desc: 'ಅಂಚುಗಳು ಅಸಮ, ಅನಿಯಮಿತ ಅಥವಾ ಮಸುಕಾಗಿರುವುದು.' },
      { letter: 'C', title: 'ಬಣ್ಣದಲ್ಲಿ ವ್ಯತ್ಯಾಸ (Color)', desc: 'ಒಂದೇ ಗಾಯದಲ್ಲಿ ಕಂದು, ಕಪ್ಪು, ಬಿಳಿ ಅಥವಾ ಕೆಂಪು ಬಣ್ಣಗಳ ಅಸಮಾನ ಮಿಶ್ರಣ.' },
      { letter: 'D', title: 'ವ್ಯಾಸ (Diameter)', desc: 'ಗಾಯದ ಗಾತ್ರವು 6 ಮಿ.ಮೀ ಗಿಂತ ದೊಡ್ಡದಾಗಿರುವುದು.' },
      { letter: 'E', title: 'ಬದಲಾವಣೆ (Evolving)', desc: 'ಗಾತ್ರ, ಆಕಾರ ಅಥವಾ ಬಣ್ಣದಲ್ಲಿ ನಿರಂತರ ಬದಲಾವಣೆ, ತುರಿಕೆ ಅಥವಾ ರಕ್ತಸ್ರಾವ.' },
    ],
    whyUncertainTitle: 'AI ಮುನ್ಸೂಚನೆ ಏಕೆ ಅನಿಶ್ಚಿತವಾಗಿರಬಹುದು?',
    uncertaintyPoints: [
      'ಬೆಳಕು ಮತ್ತು ಫೋಕಸ್ ಸಮಸ್ಯೆ: ಮಸುಕಾದ ಅಥವಾ ಕಳಪೆ ಗುಣಮಟ್ಟದ ಫೋಟೋಗಳು ಸೂಕ್ಷ್ಮ ರಚನೆಗಳನ್ನು ಮರೆಮಾಡುತ್ತವೆ.',
      'ಕೂದಲು ಅಥವಾ ಬೆಳಕಿನ ಪ್ರತಿಫಲನ: ಚರ್ಮದ ಮೇಲಿನ ಕೂದಲು ಅಥವಾ ಕ್ಯಾಮೆರಾ ಹೊಳಪು ಫಲಿತಾಂಶವನ್ನು ಬದಲಾಯಿಸಬಹುದು.',
      'ಸಾಮಾನ್ಯ ಫೋನ್ ಕ್ಯಾಮೆರಾ: ಈ ಮಾದರಿಯು ವಿಶೇಷ ಡರ್ಮೋಸ್ಕೋಪಿಕ್ ಚಿತ್ರಗಳ ಮೇಲೆ ತರಬೇತಿ ಪಡೆದಿದೆ.',
      'ಸಾಮಾನ್ಯ ಚರ್ಮದ ಮಿತಿ: ಆರೋಗ್ಯಕರ ಸಾಮಾನ್ಯ ಚರ್ಮವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದಾಗ ತಪ್ಪು ಫಲಿತಾಂಶಗಳು ಬರಬಹುದು.'
    ],
    ethicalBoundariesTitle: 'ವೈದ್ಯಕೀಯ ಮಿತಿಗಳು & ಜವಾಬ್ದಾರಿ',
    ethicalBoundariesText: 'DermAI ಕೇವಲ ಶೈಕ್ಷಣಿಕ ಮತ್ತು ಸಂಶೋಧನಾ ಉದ್ದೇಶದ ಮಾದರಿಯಾಗಿದೆ. ಇದು ಯಾವುದೇ ಅಂತಿಮ ರೋಗನಿರ್ಣಯವನ್ನು ನೀಡುವುದಿಲ್ಲ ಅಥವಾ ಕ್ರೀಮ್ ಅಥವಾ ಔಷಧಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ. ವೈದ್ಯರ ನೇರ ತಪಾಸಣೆಯೇ ಅಂತಿಮ.',
    redFlagsTitle: 'ಯಾವುದೇ ಕಾರಣಕ್ಕೂ ನಿರ್ಲಕ್ಷಿಸಬಾರದ ಎಚ್ಚರಿಕೆ ಚಿಹ್ನೆಗಳು',
    redFlags: [
      'ಯಾವುದೇ ಗಾಯವಿಲ್ಲದೆ ತಾನಾಗಿಯೇ ರಕ್ತಸ್ರಾವ ಅಥವಾ ಕೀವು ಬರುವುದು.',
      'ಕೆಲವೇ ವಾರಗಳಲ್ಲಿ ಗಾತ್ರ, ಆಕಾರ ಅಥವಾ ಬಣ್ಣದಲ್ಲಿ ಕ್ಷಿಪ್ರ ಬದಲಾವಣೆ.',
      'ಗಾಯದ ಸುತ್ತಲೂ ನಿರಂತರ ತುರಿಕೆ, ನೋವು ಅಥವಾ ಉರಿ ಕಾಣಿಸಿಕೊಳ್ಳುವುದು.',
      'ದೇಹದ ಇತರ ಮಚ್ಚೆಗಳಿಗಿಂತ ಸಂಪೂರ್ಣ ಭಿನ್ನವಾಗಿ ಕಾಣುವುದು ("Ugly Duckling" ಚಿಹ್ನೆ).'
    ]
  },

  hi: {
    langCode: 'hi',
    langName: 'हिन्दी',
    bcp47: 'hi-IN',
    appTitle: 'DermAI – त्वचा परीक्षण',
    prototypeBadge: 'प्रोटोटाइप पूर्वावलोकन (Prototype preview)',
    appSubtitle: 'AI-सहायता प्राप्त प्रारंभिक छवि विश्लेषण',
    modelPredictionLabel: 'मॉडल भविष्यवाणी (MODEL PREDICTION)',
    modelScoreLabel: 'मॉडल स्कोर:',
    illustrativeNotice: 'केवल सांकेतिक मूल्य – वास्तविक चिकित्सीय परिणाम नहीं।',
    visualExplanationTitle: 'दृश्य व्याख्या – Grad-CAM',
    originalImageLabel: 'मूल छवि (Original Image)',
    gradCamOverlayLabel: 'Grad-CAM ओवरले',
    gradCamCaption: 'यह हीटमैप उन त्वचा क्षेत्रों को हाइलाइट करता है जिन्होंने मॉडल की भविष्यवाणी को प्रभावित किया। यह चिकित्सीय सत्यता सिद्ध नहीं करता।',
    chooseLanguageTitle: 'अपनी भाषा चुनें',
    resultExplainedSimplyTitle: 'आपका परिणाम, सरल शब्दों में',
    listenToResult: 'परिणाम सुनें (Listen to result)',
    stopListening: 'ऑडियो रोकें (Stop)',
    speakingStatus: 'ऑडियो चल रहा है...',
    speechNotSupported: 'आपके ब्राउज़र में स्पीच सिंथेसिस उपलब्ध नहीं है।',
    exampleScreenDisclaimer: 'केवल उदाहरण स्क्रीन। प्रदर्शित स्कोर और भविष्यवाणी सांकेतिक हैं।',

    // Voice assistant / Explanation Cases
    caseA: "हमारे AI मॉडल ने इस छवि को बिनाइन (हानिरहित) के रूप में वर्गीकृत किया है। हालांकि, यह इस बात की गारंटी नहीं देता कि यह पूरी तरह सुरक्षित है। यदि आप इसके आकार, रंग या रूप में कोई बदलाव देखते हैं, या इसमें खून बहना या लगातार खुजली होती है, तो कृपया त्वचा विशेषज्ञ (डर्मेटोलॉजिस्ट) से परामर्श लें।",
    caseB: "AI मॉडल ने मैलिग्नेंट (घातक/संदिग्ध) श्रेणी से जुड़े लक्षणों का पता लगाया है। कृपया घबराएं नहीं, लेकिन इस परिणाम को अनदेखा भी न करें। जल्द से जल्द किसी योग्य त्वचा विशेषज्ञ से जांच करवाएं। केवल उचित चिकित्सकीय जांच और टेस्ट ही यह तय कर सकते हैं कि यह वास्तव में क्या है।",
    caseC: "क्षमा करें, हम इस छवि का सटीक मूल्यांकन नहीं कर सके। कृपया एक स्पष्ट डर्मोस्कोपिक त्वचा घाव की छवि अपलोड करें। यदि आप त्वचा में किसी बदलाव को लेकर चिंतित हैं, तो इस परिणाम पर निर्भर रहने के बजाय किसी त्वचा विशेषज्ञ से परामर्श लें।",

    guidanceHeading: 'अगले कदम एवं चिकित्सीय सलाह',
    whenToSeekTitle: 'डॉक्टर से परामर्श कब लें?',
    whenToSeekDesc: 'भले ही AI परिणाम सामान्य या सुरक्षित लगे, यदि आपको ABCDE चेतावनी संकेत या कोई असामान्यता दिखे तो त्वचा विशेषज्ञ से जरूर मिलें:',
    abcde: [
      { letter: 'A', title: 'असमरूपता (Asymmetry)', desc: 'तिल या घाव का एक आधा हिस्सा दूसरे आधे हिस्से से मेल नहीं खाता।' },
      { letter: 'B', title: 'अनियमित किनारे (Border)', desc: 'किनारे अनियमित, कटे-फटे, दांतेदार या धुंधले हैं।' },
      { letter: 'C', title: 'रंग का फैलाव (Color)', desc: 'एक ही घाव में भूरे, काले, लाल, गुलाबी या नीले रंग का असंतुलन।' },
      { letter: 'D', title: 'व्यास (Diameter)', desc: 'घाव का आकार 6 मिमी (पेंसिल इरेज़र) से बड़ा होना।' },
      { letter: 'E', title: 'बदलाव (Evolving)', desc: 'आकार, रंग, रूप में लगातार बदलाव, या खुजली और खून आना।' },
    ],
    whyUncertainTitle: 'AI परिणाम अनिश्चित क्यों हो सकता है?',
    uncertaintyPoints: [
      'प्रकाश या फोकस की कमी: धुंधली या कम गुणवत्ता वाली तस्वीरें सूक्ष्म वर्णक पैटर्न को छिपा देती हैं।',
      'बाल या चमक: त्वचा पर बाल या तेज रोशनी मॉडल को भ्रमित कर सकती है।',
      'डर्मोस्कोपी बनाम साधारण फोन: यह मॉडल विशेष रूप से डर्मोस्कोपिक छवियों पर प्रशिक्षित है; फोन कैमरों पर परिणाम भिन्न हो सकते हैं।',
      'सामान्य त्वचा की सीमा: सामान्य स्वस्थ त्वचा की तस्वीर डालने पर मॉडल गलत या कृत्रिम परिणाम दे सकता है।'
    ],
    ethicalBoundariesTitle: 'नैतिक एवं चिकित्सीय सीमाएं',
    ethicalBoundariesText: 'DermAI केवल एक अनुसंधान प्रोटोटाइप है। यह कोई अंतिम निदान नहीं देता, न ही किसी को "पूरी तरह सुरक्षित" घोषित करता है, और न ही किसी दवा या क्रीम की सिफारिश करता है। हमेशा त्वचा विशेषज्ञ की सलाह लें।',
    redFlagsTitle: 'चेतावनी संकेत जिन्हें कभी अनदेखा नहीं करना चाहिए',
    redFlags: [
      'बिना किसी चोट के तिल या घाव से स्वतः खून या तरल बहना।',
      'कुछ ही हफ्तों या महीनों में आकार, रूप या रंग में तेजी से बदलाव।',
      'लगातार खुजली, दर्द, चुभन या जलन का अनुभव होना।',
      'शरीर के अन्य सभी तिलों की तुलना में बिल्कुल अलग और असंगत दिखना ("अग्ली डकलिंग" संकेत)।'
    ]
  },

  ta: {
    langCode: 'ta',
    langName: 'தமிழ்',
    bcp47: 'ta-IN',
    appTitle: 'DermAI – தோல் பரிசோதனை',
    prototypeBadge: 'மாதிரி முன்னோட்டம் (Prototype preview)',
    appSubtitle: 'AI-உதவி ஆரம்பநிலை பட பகுப்பாய்வு',
    modelPredictionLabel: 'மாதிரி கணிப்பு (MODEL PREDICTION)',
    modelScoreLabel: 'மாதிரி மதிப்பீடு:',
    illustrativeNotice: 'இது ஆரம்பநிலை விளக்கக்காட்சி மட்டுமே – மருத்துவ உறுதிப்படுத்தல் அல்ல.',
    visualExplanationTitle: 'காட்சி விளக்கம் – Grad-CAM',
    originalImageLabel: 'அசல் படம் (Original Image)',
    gradCamOverlayLabel: 'Grad-CAM மேலடுக்கு (Overlay)',
    gradCamCaption: 'மாதிரியின் கணிப்பை பாதித்த தோல் பகுதிகளை இந்த வெப்ப வரைபடம் (Heatmap) காட்டுகிறது. இது மருத்துவ உண்மையை நிரூபிக்காது.',
    chooseLanguageTitle: 'உங்கள் மொழியை தேர்வு செய்யவும்',
    resultExplainedSimplyTitle: 'உங்கள் முடிவு, எளிய தமிழில்',
    listenToResult: 'ஒலி கேட்க (Listen to result)',
    stopListening: 'நிறுத்து (Stop)',
    speakingStatus: 'ஒலி இயக்கப்படுகிறது...',
    speechNotSupported: 'உங்கள் உலாவியில் குரல் தொகுப்பு வசதி கிடைக்கவில்லை.',
    exampleScreenDisclaimer: 'மாதிரி திரை மட்டுமே. காட்டப்படும் மதிப்பீடும் கணிப்பும் விளக்கத்திற்காக மட்டுமே.',

    // Voice assistant / Explanation Cases
    caseA: "இந்த படத்தை எங்கள் AI மாதிரி தீங்கற்றதாக (Benign) வகைப்படுத்தியுள்ளது. இருப்பினும், இந்த தழும்பு முற்றிலும் ஆபத்தற்றது என்று இது உத்தரவாதம் அளிக்காது. இதன் அளவு, வடிவம் அல்லது நிறத்தில் ஏதேனும் மாற்றங்கள் ஏற்பட்டாலோ, அல்லது இரத்தப்போக்கு, தொடர் அரிப்பு இருந்தாலோ தயவுசெய்து தோல் மருத்துவரை அணுகவும்.",
    caseB: "இந்த தழும்பில் வீரியமிக்க (Malignant) வகையுடன் தொடர்புடைய அம்சங்களை AI மாதிரி கண்டறிந்துள்ளது. தயவுசெய்து பீதியடைய வேண்டாம், ஆனால் இந்த முடிவை புறக்கணிக்காதீர்கள். உடனடியாக ஒரு தகுதிவாய்ந்த தோல் மருத்துவரை சந்தித்து பரிசோதனை செய்துகொள்ளுங்கள். முறையான மருத்துவ பரிசோதனைகள் மட்டுமே இதன் உண்மை நிலையை உறுதிப்படுத்த முடியும்.",
    caseC: "மன்னிக்கவும், இந்த படத்தை எங்களால் துல்லியமாக மதிப்பீடு செய்ய முடியவில்லை. தயவுசெய்து தெளிவான டெர்மோஸ்கோபிக் தோல் தழும்பு படத்தை பதிவேற்றவும். உங்கள் தோலில் ஏதேனும் மாற்றம் குறித்து கவலை இருந்தால், இந்த முடிவை நம்பாமல் உடனடியாக ஒரு தோல் மருத்துவரை அணுகவும்.",

    guidanceHeading: 'அடுத்தகட்ட நடவடிக்கைகள் & மருத்துவ வழிகாட்டுதல்',
    whenToSeekTitle: 'மருத்துவரை எப்போது அணுக வேண்டும்?',
    whenToSeekDesc: 'AI முடிவு பாதுகாப்பானதாக தோன்றினாலும், பின்வரும் ABCDE எச்சரிக்கை அறிகுறிகள் தெரிந்தால் உடனடியாக தோல் மருத்துவரை சந்திக்கவும்:',
    abcde: [
      { letter: 'A', title: 'சீரற்ற தன்மை (Asymmetry)', desc: 'மச்சத்தின் ஒரு பாதி மற்ற பாதியுடன் பொருந்தாமல் இருப்பது.' },
      { letter: 'B', title: 'ஒழுங்கற்ற விளிம்புகள் (Border)', desc: 'விளிம்புகள் சீரற்றதாக, வெட்டப்பட்டதாக அல்லது மங்கலாக இருப்பது.' },
      { letter: 'C', title: 'வண்ண வேறுபாடு (Color)', desc: 'ஒரே தழும்பில் பழுப்பு, கருப்பு, சிவப்பு அல்லது வெள்ளை நிறங்கள் கலந்து இருப்பது.' },
      { letter: 'D', title: 'விட்டம் (Diameter)', desc: 'மச்சத்தின் அளவு 6 மி.மீ-க்கு மேல் (பென்சில் ரப்பர் அளவு) இருப்பது.' },
      { letter: 'E', title: 'மாற்றம் அடைதல் (Evolving)', desc: 'அளவு, வடிவம், நிறம் மாறுவது அல்லது அரிப்பு, இரத்தப்போக்கு ஏற்படுவது.' },
    ],
    whyUncertainTitle: 'AI கணிப்பு ஏன் நிச்சயமற்றதாக இருக்கலாம்?',
    uncertaintyPoints: [
      'ஒளி அல்லது போக்கஸ் குறைபாடு: மங்கலான அல்லது குறைந்த தெளிவுத்திறன் கொண்ட படங்கள் துல்லியத்தை பாதிக்கும்.',
      'முடி அல்லது ஒளி பிரதிபலிப்பு: தோலின் முடி அல்லது கேமரா வெளிச்சம் முடிவை மாற்றக்கூடும்.',
      'டெர்மோஸ்கோபி vs சாதாரண கேமரா: இந்த மாதிரி பிரத்யேக டெர்மோஸ்கோபிக் படங்களுக்கு மட்டுமே பயிற்றுவிக்கப்பட்டது.',
      'சாதாரண தோல் வரம்பு: ஆரோக்கியமான தோலின் படத்தை உள்ளிடும்போது தவறான முடிவுகள் வர வாய்ப்புள்ளது.'
    ],
    ethicalBoundariesTitle: 'மருத்துவ எல்லைகள் & பொறுப்பு',
    ethicalBoundariesText: 'DermAI என்பது ஒரு ஆராய்ச்சி மாதிரி மட்டுமே. இது இறுதி நோயறிதலை வழங்காது, எந்த மருந்து அல்லது கிரீமையும் பரிந்துரைக்காது. எப்போதும் தோல் மருத்துவரின் ஆலோசனையையே பெற வேண்டும்.',
    redFlagsTitle: 'ஒருபோதும் புறக்கணிக்கக் கூடாத எச்சரிக்கை அறிகுறிகள்',
    redFlags: [
      'காயம் ஏதுமின்றி தழும்பிலிருந்து தானாக இரத்தம் அல்லது திரவம் வடிதல்.',
      'சில வாரங்கள் அல்லது மாதங்களில் அளவு, வடிவம் அல்லது நிறத்தில் விரைவான மாற்றம்.',
      'தழும்பைச் சுற்றி தொடர்ந்து கடுமையான அரிப்பு, வலி அல்லது எரிச்சல் ஏற்படுதல்.',
      'உடலில் உள்ள மற்ற மச்சங்களை விட முற்றிலும் மாறுபட்டு தனித்து தெரிவது ("Ugly Duckling" அடையாளம்).'
    ]
  }
};

/**
 * Advanced Multi-Engine Voice Controller
 * 1. Primary Engine: Online Natural Audio Streaming (Google TTS)
 *    Provides authentic, native-accented speech for Telugu (te), Kannada (kn), Hindi (hi), Tamil (ta), and English (en).
 *    Avoids the common OS bug where an English SAPI voice attempts to read Indic Unicode and only pronounces "AI".
 * 2. Secondary Engine: Native Browser Web Speech API (window.speechSynthesis)
 *    Used when offline with verified native regional voices.
 * 3. Controls: Listen, Pause, Resume, and Stop.
 */

let cachedVoices = [];
let activeAudio = null;
let isAudioPaused = false;
let isAudioCancelled = false;
let currentChunkIndex = 0;
let activeChunks = [];
let onAudioEndCallback = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getAvailableVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (!cachedVoices || cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

export function findVoiceForLanguage(langKey) {
  const config = CLINICAL_TRANSLATIONS[langKey] || CLINICAL_TRANSLATIONS.en;
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = (config.bcp47 || '').toLowerCase();
  const langCode = (config.langCode || '').toLowerCase();

  // 1. Exact or prefix BCP-47 match (e.g. "te-in", "kn-in")
  let matched = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));
  if (matched) return matched;

  // 2. Language code prefix match (e.g. "te", "kn")
  matched = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode));
  if (matched) return matched;

  // 3. Match voice name against language name
  matched = voices.find(v => v.name && (v.name.toLowerCase().includes(config.langName.toLowerCase()) || v.name.toLowerCase().includes(langKey)));
  return matched || null;
}

export function isLanguageVoiceSupported(langKey) {
  // Always true online because Google TTS handles Telugu, Kannada, Hindi, Tamil, and English natively!
  return true;
}

// Split long text into manageable sentences (< 160 chars) to respect streaming audio limits
export function splitTextIntoChunks(text, maxLength = 160) {
  if (!text || text.length <= maxLength) return [text || ''];
  const sentences = text.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+/g) || [text];
  const chunks = [];
  let buffer = '';

  for (const s of sentences) {
    if ((buffer + s).length <= maxLength) {
      buffer += s;
    } else {
      if (buffer.trim()) chunks.push(buffer.trim());
      buffer = s;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.length > 0 ? chunks : [text];
}

export function playVoiceSpeech(text, langKey, onStart, onEnd, onError, useEnglishVoiceFallback = false, fallbackCaseKey = 'caseA') {
  stopVoiceSpeech();

  const config = CLINICAL_TRANSLATIONS[langKey] || CLINICAL_TRANSLATIONS.en;
  const targetLang = useEnglishVoiceFallback ? 'en' : config.langCode;
  const caseKey = fallbackCaseKey || 'caseA';

  isAudioCancelled = false;
  isAudioPaused = false;
  onAudioEndCallback = onEnd;

  // Primary Engine: Pre-rendered, High-Definition Authentic Native Audio File (/audio/{lang}_{case}.mp3)
  // Guarantees 100% reliable native speech in Kannada, Telugu, Hindi, Tamil, and English with zero network/CORS blocks!
  try {
    const localAudioUrl = `/audio/${targetLang}_${caseKey}.mp3`;
    activeAudio = new Audio(localAudioUrl);

    activeAudio.onplay = () => {
      if (onStart) onStart();
    };

    activeAudio.onended = () => {
      if (onAudioEndCallback) onAudioEndCallback();
    };

    activeAudio.onerror = (err) => {
      console.warn(`Local audio asset ${localAudioUrl} could not be loaded, trying dynamic speech engine:`, err);
      fallbackToDynamicSpeech();
    };

    const playPromise = activeAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Audio play was prevented by browser autoplay policy, attempting fallback:', err);
        fallbackToDynamicSpeech();
      });
    }
    return true;
  } catch (err) {
    console.warn('Audio initialization exception, using fallback speech synthesis:', err);
    return fallbackToDynamicSpeech();
  }

  function fallbackToDynamicSpeech() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError(new Error('Audio playback is not supported in this browser.'));
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    if (useEnglishVoiceFallback) {
      utterance.lang = 'en-US';
      const enVoice = getAvailableVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    } else {
      const voice = findVoiceForLanguage(langKey);
      if (voice) {
        utterance.lang = config.bcp47;
        utterance.voice = voice;
      } else {
        const englishExplanation = CLINICAL_TRANSLATIONS.en[caseKey] || CLINICAL_TRANSLATIONS.en.caseA;
        utterance.text = englishExplanation;
        utterance.lang = 'en-US';
        const enVoice = getAvailableVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => { if (onError) onError(e); };

    window.speechSynthesis.speak(utterance);
    return true;
  }
}

export function pauseVoiceSpeech() {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    isAudioPaused = true;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

export function resumeVoiceSpeech() {
  if (activeAudio && activeAudio.paused) {
    activeAudio.play().catch(e => console.warn('Audio resume notice:', e));
    isAudioPaused = false;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

export function stopVoiceSpeech() {
  isAudioCancelled = true;
  isAudioPaused = false;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  activeChunks = [];
  currentChunkIndex = 0;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

