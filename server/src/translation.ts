import { LingoDotDevEngine } from "lingo.dev/sdk";
import { extractContent, restoreContent } from './markdown.js';
import { config } from './config.js';

const cache = new Map<string, string>();
const sourceLangCache = new Map<string, string>(); // Cache for detected source languages

export async function translateMarkdown(
    markdown: string, 
    targetLanguage: string, 
    sourceLanguage?: string
): Promise<string> {
    // Create cache key including source language
    const sourceLang = sourceLanguage || await detectSourceLanguage(markdown);
    const cacheKey = `${sourceLang}:${targetLanguage}:${Buffer.from(markdown).toString('base64')}`;
    
    if (cache.has(cacheKey)) {
        console.log('Serving from cache');
        return cache.get(cacheKey)!;
    }

    console.log(`Translating from ${sourceLang} to ${targetLanguage}...`);

    // 1. Extract/Mask
    const { maskedText, placeholders } = await extractContent(markdown);

    // 2. Call API
    const translatedMaskedText = await callLingoApi(maskedText, sourceLang, targetLanguage);

    // 3. Restore
    const finalMarkdown = restoreContent(translatedMaskedText, placeholders);

    cache.set(cacheKey, finalMarkdown);
    return finalMarkdown;
}

async function detectSourceLanguage(text: string): Promise<string> {
    // Check cache first
    const textHash = Buffer.from(text.substring(0, 500)).toString('base64'); // Use first 500 chars for cache key
    if (sourceLangCache.has(textHash)) {
        const cached = sourceLangCache.get(textHash)!;
        console.log(`Using cached source language: ${cached}`);
        return cached;
    }

    // Fallback to "en" if API Key is missing
    if (!config.lingoApiKey) {
        console.log('No API key, defaulting to English');
        return "en";
    }

    try {
        const lingo = new LingoDotDevEngine({ apiKey: config.lingoApiKey });
        
        // Use Lingo.dev's recognizeLocale for language detection
        // Use a sample of the text (first 1000 chars) for faster detection
        const sampleText = text.substring(0, 1000);
        const detectedLocale = await lingo.recognizeLocale(sampleText);
        
        // Cache the detected language
        sourceLangCache.set(textHash, detectedLocale);
        console.log(`Detected source language: ${detectedLocale}`);
        
        return detectedLocale;
    } catch (error) {
        console.error("Language detection error, defaulting to English:", error);
        return "en"; // Fallback to English
    }
}

async function callLingoApi(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    // Fallback to Mock if API Key is missing
    if (!config.lingoApiKey) {
        return `[MOCK ${sourceLanguage}->${targetLanguage.toUpperCase()}] ${text}`;
    }

    try {
        const lingo = new LingoDotDevEngine({ apiKey: config.lingoApiKey });

        // Use the official SDK 'localizeText' method with detected source language
        const result = await lingo.localizeText(text, {
            sourceLocale: sourceLanguage,
            targetLocale: targetLanguage,
        });

        return result;

    } catch (error) {
        console.error("Lingo SDK Error (falling back to echo):", error);
        return `[FAILED] ${text}`;
    }
}
