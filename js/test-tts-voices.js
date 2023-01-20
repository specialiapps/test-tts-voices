/*
 * Test TTS Voices
 *
 * (C) 2023 Special iApps C.I.C. MIT License.
 *
 * Script for page that tests the text-to-speech (TTS) voices available
 * for use from JavaScript by web pages and web apps.
 *
 * It uses the SpeechSynthesis interface of the Web Speech API, which is
 * supported by all modern browsers:
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
 */

tts = {
    synth: null,
    langNames: null,
    regionNames: null,
    voiceList: [],

    init: function () {
        tts.find("langSection");
        tts.find("voiceSection");
        tts.find("textSection");
        tts.find("buttonSection");

        tts.find("langMenu");
        tts.find("voiceMenu");
        tts.find("textToSpeak");
        tts.find("speakButton");
        tts.find("clearButton");

        if ("Intl" in window && "DisplayNames" in Intl) {
            tts.langNames = new Intl.DisplayNames("en", {type: "language"});
            tts.regionNames = new Intl.DisplayNames("en", {type: "region"});
        }

        if ("speechSynthesis" in window) {
            tts.synth = window.speechSynthesis;
            tts.getVoices(); // for Safari, Old Edge, Firefox
            if (tts.synth.onvoiceschanged !== undefined) {
                tts.synth.onvoiceschanged = function () {
                    tts.getVoices(); // for Chrome, new Edge, Brave
                };
            }
        }

        document.addEventListener("input", tts.onInput);
        document.addEventListener("click", tts.onClick);
    },

    find: function (id) {
        return (tts[id] = document.getElementById(id));
    },

    enable: function (id) {
        tts[id].classList.add("enabled");
        return tts;
    },

    disable: function (id) {
        tts[id].classList.remove("enabled");
        return tts;
    },

    getLangName: function (code) {
        var name = code;
        if (tts.langNames !== null) {
            try {
                name = tts.langNames.of(code);
            } catch (err) {}
        }
        if (name == code && code in tts.languageCodeNames) {
            name = tts.languageCodeNames[code];
        }
        return name;
    },

    getLocalizedLangName: function (lang, code) {
        var name = code;
        if (tts.langNames !== null) {
            try {
                var names = new Intl.DisplayNames(lang, {type: "language"});
                name = names.of(code);
            } catch (err) {}
        }
        if (name == code && code in tts.localizedLanguageCodeNames) {
            name = tts.localizedLanguageCodeNames[code];
        }
        return name;
    },

    getRegionName: function (code) {
        var name = code;
        if (tts.regionNames !== null) {
            try {
                // This can fail, e.g. in Safari when passed "SCOTLAND"
                name = tts.regionNames.of(code);
            } catch (err) {}
        }
        if (name == code && code in tts.regionCodeNames) {
            name = tts.regionCodeNames[code];
        }
        return name;
    },

    getLocalizedDefaultText: function (lang) {
        var text = tts.localizedDefaultText[lang];
        return text ? text : "Default";
    },

    splitLocaleCode: function (code) {
        var locale = code.split("-");
        var lang = locale.shift();
        var region = locale.join("-");
        return {lang: lang, region: region};
    },

    getVoices: function () {
        tts.clearOptions();
        tts.voiceList = tts.synth.getVoices();

        var set = new Set();
        var arr = [];

        // get set of voice language codes (without regard to region)
        for (var i = 0; i < tts.voiceList.length; i++) {
            var voice = tts.voiceList[i];
            console.log(
                "Voice %d: URI %s, name %s, lang %s",
                i,
                voice.voiceURI,
                voice.name,
                voice.lang
            );
            set.add(tts.splitLocaleCode(voice.lang).lang);
        }

        // create array of language {code, name} elements, sorted by name
        set.forEach(function (code) {
            arr.push({code: code, name: tts.getLangName(code)});
        });
        arr.sort(function (e1, e2) {
            var name1 = e1.name.toLowerCase();
            var name2 = e2.name.toLowerCase();
            return name1.localeCompare(name2);
        });

        tts.populateLangMenu(arr);
    },

    populateLangMenu: function (arr) {
        tts.langMenu.options.length = tts.voiceMenu.options.length = 0;
        tts.disable("langSection")
            .disable("voiceSection")
            .disable("textSection")
            .disable("buttonSection");

        for (var i = -2; i < arr.length; i++) {
            var option = document.createElement("option");
            if (i == -2) {
                option.value = "";
                option.textContent = "";
            } else if (i == -1) {
                option.value = "all";
                option.textContent = "All";
            } else {
                option.value = arr[i].code;
                option.textContent = arr[i].name;
            }
            tts.langMenu.appendChild(option);
        }

        tts.enable("langSection");
    },

    populateVoiceMenu: function (chosenLang) {
        tts.voiceMenu.options.length = 0;
        tts.disable("voiceSection").disable("textSection").disable("buttonSection");

        var arr = tts.voiceList;

        for (var i = -2; i < arr.length; i++) {
            var option = document.createElement("option");
            option.style.width = "500px";
            if (i == -2) {
                option.value = "";
                option.textContent = "";
            } else if (i == -1) {
                option.value = "default";
                option.textContent = "Default";
            } else {
                var locale = tts.splitLocaleCode(arr[i].lang);
                if (chosenLang != "all" && chosenLang != locale.lang) {
                    continue;
                }
                option.value = i;
                option.textContent = tts.voiceDescription(arr[i].name, locale);
            }
            tts.voiceMenu.appendChild(option);
        }

        tts.enable("voiceSection");
    },

    voiceDescription: function (name, locale) {
        var text = name + ", " + tts.getLangName(locale.lang);
        if (locale.region != "") {
            text += " (" + tts.getRegionName(locale.region) + ")";
        }
        return text;
    },

    onInput: function (ev) {
        var value = ev.target.value;
        if (ev.target === tts.langMenu) {
            if (value === "") {
                tts.clearOptions();
            } else {
                tts.selectedLangCode = value;
                console.log("Selected language " + value);
                tts.populateVoiceMenu(value);
            }
        } else if (ev.target == tts.voiceMenu) {
            if (value === "") {
                tts.disable("textSection").disable("buttonSection");
            } else {
                tts.selectedVoiceIndex = value;
                console.log("Selected voice at index " + value);
                tts.enable("textSection").enable("buttonSection");
            }
        }
    },

    onClick: function (ev) {
        if (ev.target === tts.clearButton) {
            tts.clearOptions();
        } else if (ev.target === tts.speakButton) {
            tts.speakText();
        }
    },

    speakText: function () {
        var text = tts.textToSpeak.value.trim();
        var voice = null;
        var lang = null;
        var name = null;

        if (tts.selectedVoiceIndex >= 0) {
            voice = tts.voiceList[tts.selectedVoiceIndex];
            lang = voice.lang;
            name = voice.name;
        } else if (tts.selectedLangCode != "all") {
            lang = tts.selectedLangCode;
        }

        if (text == "") {
            if (lang === null) {
                text = "Default";
            } else {
                var langName = tts.getLocalizedLangName(lang, lang);
                if (voice === null) {
                    text = tts.getLocalizedDefaultText(lang) + ": " + langName;
                } else {
                    text = name + ". " + langName;
                }
            }
        }

        console.log("Speaking text '" + text + "'", lang, voice);
        var utterance = new SpeechSynthesisUtterance(text);

        if (lang !== null) {
            utterance.lang = lang;
        }
        if (voice != null) {
            utterance.voice = voice;
        }

        tts.synth.speak(utterance);
    },

    clearOptions: function () {
        tts.langMenu.value = "";
        tts.voiceMenu.options.length = 0;
        tts.textToSpeak.value = "";
        tts.disable("voiceSection").disable("textSection").disable("buttonSection");
    },

    // All properties below are cosmetic...

    // fallback - only used if not provided by Window.Intl
    languageCodeNames: {
        af: "Afrikaans",
        ak: "Akan",
        am: "Amharic",
        ar: "Arabic",
        as: "Assamese",
        az: "Azerbaijani",
        be: "Belarusian",
        bg: "Bulgarian",
        bm: "Bambara",
        bn: "Bengali",
        bo: "Tibetan",
        br: "Breton",
        bs: "Bosnian",
        ca: "Catalan",
        cs: "Czech",
        cy: "Welsh",
        da: "Danish",
        de: "German",
        "de-AT": "German (Austria)",
        "de-CH": "German (Switzerland)",
        dz: "Dzongkha",
        ee: "Ewe",
        el: "Greek",
        en: "English",
        "en-AU": "English (Australia)",
        "en-CA": "English (Canada)",
        "en-GB": "English (United Kingdom)",
        "en-US": "English (United States)",
        eo: "Esperanto",
        es: "Spanish",
        "es-ES": "Spanish (Spain)",
        "es-MX": "Spanish (Mexico)",
        et: "Estonian",
        eu: "Basque",
        fa: "Persian",
        ff: "Fulah",
        fi: "Finnish",
        fo: "Faroese",
        fr: "French",
        "fr-CA": "French (Canada)",
        "fr-CH": "French (Switzerland)",
        "fr-FR": "French (France)",
        fy: "Western Frisian",
        ga: "Irish",
        gd: "Gaelic",
        gl: "Galician",
        gu: "Gujarati",
        gv: "Manx",
        ha: "Hausa",
        he: "Hebrew",
        hi: "Hindi",
        hr: "Croatian",
        hu: "Hungarian",
        hy: "Armenian",
        id: "Indonesian",
        ig: "Igbo",
        ii: "Sichuan Yi",
        is: "Icelandic",
        it: "Italian",
        ja: "Japanese",
        ka: "Georgian",
        ki: "Kikuyu",
        kk: "Kazakh",
        kl: "Greenlandic",
        km: "Central Khymer",
        kn: "Kannada",
        ko: "Korean",
        ks: "Kashmiri",
        kw: "Cornish",
        ky: "Kirghiz",
        lb: "Luxembourgish",
        lg: "Ganda",
        ln: "Lingala",
        lo: "Lao",
        lt: "Lithuanian",
        lu: "Luba-Katanga",
        lv: "Latvian",
        mg: "Malagasy",
        mk: "Macedonian",
        ml: "Malayalam",
        mn: "Mongolian",
        mr: "Marathi",
        ms: "Malay",
        mt: "Maltese",
        my: "Burmese",
        nb: "Norwegian Bokm\u00e5l",
        nd: "North Ndebele",
        ne: "Nepali",
        nl: "Dutch",
        "nl-BE": "Flemish",
        nn: "Norwegian Nynorsk",
        no: "Norwegian",
        om: "Oromo",
        or: "Oriya",
        os: "Ossetian",
        pa: "Punjabi",
        pl: "Polish",
        ps: "Pashto",
        pt: "Portuguese",
        "pt-BR": "Portuguese (Brasil)",
        "pt-PT": "Portuguese (Portugal)",
        qu: "Quechua",
        rm: "Romansh",
        rn: "Rundi",
        ro: "Romanian",
        "ro-MD": "Moldovan",
        ru: "Russian",
        rw: "Kinyarwanda",
        se: "Northern Sami",
        sg: "Sango",
        sh: "Serbo-Croatian",
        si: "Sinhalese",
        sk: "Slovak",
        sl: "Slovenian",
        sn: "Shona",
        so: "Somali",
        sq: "Albanian",
        sr: "Serbian",
        sv: "Swedish",
        sw: "Swahili",
        ta: "Tamil",
        te: "Telugu",
        th: "Thai",
        ti: "Tigrinya",
        tl: "Tagalog",
        to: "Tongan",
        tr: "Turkish",
        ug: "Uighur",
        uk: "Ukrainian",
        ur: "Urdu",
        uz: "Uzbek",
        vi: "Vietnamese",
        yi: "Yiddish",
        yo: "Yoruba",
        zh: "Chinese",
        "zh-Hans": "Chinese (Traditional)",
        "zh-Hant": "Chinese (Simplified)",
        zu: "Zulu",
    },

    // fallback - only used if not provided by Window.Intl
    localizedLanguageCodeNames: {
        af: "Afrikaans",
        ak: "Akan",
        am: "\u12a0\u121b\u122d\u129b",
        ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
        as: "\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be",
        az: "az\u0259rbaycan",
        be: "\u0431\u0435\u043b\u0430\u0440\u0443\u0441\u043a\u0430\u044f",
        bg: "\u0431\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438",
        bm: "bamanakan",
        bn: "\u09ac\u09be\u0982\u09b2\u09be",
        bo: "\u0f56\u0f7c\u0f51\u0f0b\u0f66\u0f90\u0f51\u0f0b",
        br: "brezhoneg",
        bs: "bosanski",
        ca: "catal\u00e0",
        cs: "\u010de\u0161tina",
        cy: "Cymraeg",
        da: "dansk",
        de: "Deutsch",
        "de-AT": "\u00d6sterreichisches Deutsch",
        "de-CH": "Schweizer Hochdeutsch",
        dz: "\u0f62\u0fab\u0f7c\u0f44\u0f0b\u0f41",
        ee: "e\u028begbe",
        el: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac",
        en: "English",
        "en-AU": "Australian English",
        "en-CA": "Canadian English",
        "en-GB": "British English",
        "en-US": "American English",
        eo: "esperanto",
        es: "espa\u00f1ol",
        "es-ES": "espa\u00f1ol de Espa\u00f1a",
        "es-MX": "espa\u00f1ol de M\u00e9xico",
        et: "eesti",
        eu: "euskara",
        fa: "\u0641\u0627\u0631\u0633\u06cc",
        ff: "Pulaar",
        fi: "suomi",
        fo: "f\u00f8royskt",
        fr: "fran\u00e7ais",
        "fr-CA": "fran\u00e7ais canadien",
        "fr-CH": "fran\u00e7ais suisse",
        "fr-FR": "fran\u00e7ais france",
        fy: "West-Frysk",
        ga: "Gaeilge",
        gd: "G\u00e0idhlig",
        gl: "galego",
        gu: "\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0",
        gv: "Gaelg",
        ha: "Hausa",
        he: "\u05e2\u05d1\u05e8\u05d9\u05ea",
        hi: "\u0939\u093f\u0902\u0926\u0940",
        hr: "hrvatski",
        hu: "magyar",
        hy: "\u0570\u0561\u0575\u0565\u0580\u0565\u0576",
        id: "Bahasa Indonesia",
        ig: "Igbo",
        ii: "\ua188\ua320\ua259",
        is: "\u00edslenska",
        it: "italiano",
        ja: "\u65e5\u672c\u8a9e",
        ka: "\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8",
        ki: "Gikuyu",
        kk: "\u049b\u0430\u0437\u0430\u049b \u0442\u0456\u043b\u0456",
        kl: "kalaallisut",
        km: "\u1781\u17d2\u1798\u17c2\u179a",
        kn: "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1",
        ko: "\ud55c\uad6d\uc5b4",
        ks: "\u06a9\u0672\u0634\u064f\u0631",
        kw: "kernewek",
        ky: "\u043a\u044b\u0440\u0433\u044b\u0437\u0447\u0430",
        lb: "L\u00ebtzebuergesch",
        lg: "Luganda",
        ln: "ling\u00e1la",
        lo: "\u0ea5\u0eb2\u0ea7",
        lt: "lietuvi\u0173",
        lu: "Tshiluba",
        lv: "latvie\u0161u",
        mg: "Malagasy",
        mk: "\u043c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438",
        ml: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02",
        mn: "\u043c\u043e\u043d\u0433\u043e\u043b",
        mr: "\u092e\u0930\u093e\u0920\u0940",
        ms: "Bahasa Melayu",
        mt: "Malti",
        my: "\u1017\u1019\u102c",
        nb: "norsk bokm\u00e5l",
        nd: "isiNdebele",
        ne: "\u0928\u0947\u092a\u093e\u0932\u0940",
        nl: "Nederlands",
        "nl-BE": "Vlaams",
        nn: "nynorsk",
        no: "norsk",
        om: "Oromoo",
        or: "\u0b13\u0b21\u0b3c\u0b3f\u0b06",
        os: "\u0438\u0440\u043e\u043d",
        pa: "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40",
        pl: "polski",
        ps: "\u067e\u069a\u062a\u0648",
        pt: "portugu\u00eas",
        "pt-BR": "portugu\u00eas do Brasil",
        "pt-PT": "portugu\u00eas europeu",
        qu: "Runasimi",
        rm: "rumantsch",
        rn: "Ikirundi",
        ro: "rom\u00e2n\u0103",
        "ro-MD": "moldoveneasc\u0103",
        ru: "\u0440\u0443\u0441\u0441\u043a\u0438\u0439",
        rw: "Kinyarwanda",
        se: "davvis\u00e1megiella",
        sg: "S\u00e4ng\u00f6",
        sh: "Srpskohrvatski",
        si: "\u0dc3\u0dd2\u0d82\u0dc4\u0dbd",
        sk: "sloven\u010dina",
        sl: "sloven\u0161\u010dina",
        sn: "chiShona",
        so: "Soomaali",
        sq: "shqip",
        sr: "\u0441\u0440\u043f\u0441\u043a\u0438",
        sv: "svenska",
        sw: "Kiswahili",
        ta: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd",
        te: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41",
        th: "\u0e44\u0e17\u0e22",
        ti: "\u1275\u130d\u122d\u129b",
        tl: "Tagalog",
        to: "lea fakatonga",
        tr: "T\u00fcrk\u00e7e",
        ug: "\u0626\u06c7\u064a\u063a\u06c7\u0631\u0686\u06d5",
        uk: "\u0443\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430",
        ur: "\u0627\u0631\u062f\u0648",
        uz: "o\u02bbzbekcha",
        vi: "Ti\u1ebfng Vi\u1ec7t",
        yi: "\u05d9\u05d9\u05b4\u05d3\u05d9\u05e9",
        yo: "\u00c8d\u00e8 Yor\u00f9b\u00e1",
        zh: "\u4e2d\u6587",
        "zh-Hans": "\u7b80\u4f53\u4e2d\u6587",
        "zh-Hant": "\u7e41\u9ad4\u4e2d\u6587",
        zu: "isiZulu",
    },

    // fallback - only used if not provided by Window.Intl
    regionCodeNames: {
        AD: "Andorra",
        AE: "United Arab Emirates",
        AF: "Afghanistan",
        AG: "Antigua and Barbuda",
        AI: "Anguilla",
        AL: "Albania",
        AM: "Armenia",
        AO: "Angola",
        AQ: "Antarctica",
        AR: "Argentina",
        AS: "American Samoa",
        AT: "Austria",
        AU: "Australia",
        AW: "Aruba",
        AX: "Åland Islands",
        AZ: "Azerbaijan",
        BA: "Bosnia and Herzegovina",
        BB: "Barbados",
        BD: "Bangladesh",
        BE: "Belgium",
        BF: "Burkina Faso",
        BG: "Bulgaria",
        BH: "Bahrain",
        BI: "Burundi",
        BJ: "Benin",
        BL: "Saint Barthélemy",
        BM: "Bermuda",
        BN: "Brunei Darussalam",
        BO: "Bolivia",
        BQ: "Bonaire, Sint Eustatius and Saba",
        BR: "Brazil",
        BS: "Bahamas",
        BT: "Bhutan",
        BV: "Bouvet Island",
        BW: "Botswana",
        BY: "Belarus",
        BZ: "Belize",
        CA: "Canada",
        CC: "Cocos (Keeling) Islands",
        CD: "Democratic Republic of the Congo",
        CF: "Central African Republic",
        CG: "Congo",
        CH: "Switzerland",
        CI: "Côte d'Ivoire",
        CK: "Cook Islands",
        CL: "Chile",
        CM: "Cameroon",
        CN: "China",
        CO: "Colombia",
        CR: "Costa Rica",
        CU: "Cuba",
        CV: "Cabo Verde",
        CW: "Curaçao",
        CX: "Christmas Island",
        CY: "Cyprus",
        CZ: "Czechia",
        DE: "Germany",
        DJ: "Djibouti",
        DK: "Denmark",
        DM: "Dominica",
        DO: "Dominican Republic",
        DZ: "Algeria",
        EC: "Ecuador",
        EE: "Estonia",
        EG: "Egypt",
        EH: "Western Sahara",
        ER: "Eritrea",
        ES: "Spain",
        ET: "Ethiopia",
        FI: "Finland",
        FJ: "Fiji",
        FK: "Falkland Islands (Malvinas)",
        FM: "Micronesia",
        FO: "Faroe Islands",
        FR: "France",
        GA: "Gabon",
        GB: "United Kingdom",
        GD: "Grenada",
        GE: "Georgia",
        GF: "French Guiana",
        GG: "Guernsey",
        GH: "Ghana",
        GI: "Gibraltar",
        GL: "Greenland",
        GM: "Gambia",
        GN: "Guinea",
        GP: "Guadeloupe",
        GQ: "Equatorial Guinea",
        GR: "Greece",
        GS: "South Georgia and the South Sandwich Islands",
        GT: "Guatemala",
        GU: "Guam",
        GW: "Guinea-Bissau",
        GY: "Guyana",
        HK: "Hong Kong",
        HM: "Heard Island and McDonald Islands",
        HN: "Honduras",
        HR: "Croatia",
        HT: "Haiti",
        HU: "Hungary",
        ID: "Indonesia",
        IE: "Ireland",
        IL: "Israel",
        IM: "Isle of Man",
        IN: "India",
        IO: "British Indian Ocean Territory",
        IQ: "Iraq",
        IR: "Iran",
        IS: "Iceland",
        IT: "Italy",
        JE: "Jersey",
        JM: "Jamaica",
        JO: "Jordan",
        JP: "Japan",
        KE: "Kenya",
        KG: "Kyrgyzstan",
        KH: "Cambodia",
        KI: "Kiribati",
        KM: "Comoros",
        KN: "Saint Kitts and Nevis",
        KP: "North Korea",
        KR: "South Korea",
        KW: "Kuwait",
        KY: "Cayman Islands",
        KZ: "Kazakhstan",
        LA: "Lao People's Democratic Republic",
        LB: "Lebanon",
        LC: "Saint Lucia",
        LI: "Liechtenstein",
        LK: "Sri Lanka",
        LR: "Liberia",
        LS: "Lesotho",
        LT: "Lithuania",
        LU: "Luxembourg",
        LV: "Latvia",
        LY: "Libya",
        MA: "Morocco",
        MC: "Monaco",
        MD: "Moldova",
        ME: "Montenegro",
        MF: "Saint Martin",
        MG: "Madagascar",
        MH: "Marshall Islands",
        MK: "North Macedonia",
        ML: "Mali",
        MM: "Myanmar",
        MN: "Mongolia",
        MO: "Macao",
        MP: "Northern Mariana Islands",
        MQ: "Martinique",
        MR: "Mauritania",
        MS: "Montserrat",
        MT: "Malta",
        MU: "Mauritius",
        MV: "Maldives",
        MW: "Malawi",
        MX: "Mexico",
        MY: "Malaysia",
        MZ: "Mozambique",
        NA: "Namibia",
        NC: "New Caledonia",
        NE: "Niger",
        NF: "Norfolk Island",
        NG: "Nigeria",
        NI: "Nicaragua",
        NL: "Netherlands",
        NO: "Norway",
        NP: "Nepal",
        NR: "Nauru",
        NU: "Niue",
        NZ: "New Zealand",
        OM: "Oman",
        PA: "Panama",
        PE: "Peru",
        PF: "French Polynesia",
        PG: "Papua New Guinea",
        PH: "Philippines",
        PK: "Pakistan",
        PL: "Poland",
        PM: "Saint Pierre and Miquelon",
        PN: "Pitcairn",
        PR: "Puerto Rico",
        PS: "Palestine, State of",
        PT: "Portugal",
        PW: "Palau",
        PY: "Paraguay",
        QA: "Qatar",
        RE: "Réunion",
        RO: "Romania",
        RS: "Serbia",
        RU: "Russian Federation",
        RW: "Rwanda",
        SA: "Saudi Arabia",
        SB: "Solomon Islands",
        SC: "Seychelles",
        SD: "Sudan",
        SE: "Sweden",
        SG: "Singapore",
        SH: "Saint Helena, Ascension and Tristan da Cunha",
        SI: "Slovenia",
        SJ: "Svalbard and Jan Mayen",
        SK: "Slovakia",
        SL: "Sierra Leone",
        SM: "San Marino",
        SN: "Senegal",
        SO: "Somalia",
        SR: "Suriname",
        SS: "South Sudan",
        ST: "Sao Tome and Principe",
        SV: "El Salvador",
        SX: "Sint Maarten",
        SY: "Syrian Arab Republic",
        SZ: "Eswatini",
        TC: "Turks and Caicos Islands",
        TD: "Chad",
        TF: "French Southern Territories",
        TG: "Togo",
        TH: "Thailand",
        TJ: "Tajikistan",
        TK: "Tokelau",
        TL: "Timor-Leste",
        TM: "Turkmenistan",
        TN: "Tunisia",
        TO: "Tonga",
        TR: "Türkiye",
        TT: "Trinidad and Tobago",
        TV: "Tuvalu",
        TW: "Taiwan, Province of China",
        TZ: "Tanzania, United Republic of",
        UA: "Ukraine",
        UG: "Uganda",
        UM: "United States Minor Outlying Islands",
        US: "United States of America",
        UY: "Uruguay",
        UZ: "Uzbekistan",
        VA: "Holy See",
        VC: "Saint Vincent and the Grenadines",
        VE: "Venezuela",
        VG: "British Virgin Islands",
        VI: "U.S. Virgin Islands",
        VN: "Vietnam",
        VU: "Vanuatu",
        WF: "Wallis and Futuna",
        WS: "Samoa",
        YE: "Yemen",
        YT: "Mayotte",
        ZA: "South Africa",
        ZM: "Zambia",
        ZW: "Zimbabwe",
    },

    // list (incomplete) of word "default" in various languages
    localizedDefaultText: {
        bg: "По подразбиране",
        ca: "Defecte",
        da: "Standard",
        de: "Standard",
        en: "Default",
        es: "Defecto",
        fi: "Oletus",
        fr: "Défaut",
        hr: "Osnovni",
        it: "Default",
        nb: "Standard",
        nl: "Standaard",
        pl: "Domyślne",
        pt: "Padrão",
        ro: "Implicit",
        ru: "По умолчанию",
        sq: "Parazgjedhur",
        sv: "Standard",
        tr: "Varsayılan",
        uk: "За замовчуванням",
    },
};

window.addEventListener("DOMContentLoaded", function () {
    setTimeout(tts.init, 1000);
});
