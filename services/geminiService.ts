import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from "../utils/audioUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We keep a small history to give the bot context
let chatHistory: string[] = [];

export interface ReactionResult {
  text: string;
  audioBuffer: AudioBuffer | null;
}

export const generateReaction = async (
  newChatMessages: string[], 
  audioContext: AudioContext
): Promise<ReactionResult | null> => {
  
  // Update internal history with new messages if they exist
  if (newChatMessages.length > 0) {
    chatHistory = [...chatHistory, ...newChatMessages].slice(-20);
  }

  let prompt = "";

  if (newChatMessages.length > 0) {
    prompt = `
      You are a simplistic, 3D stick figure living in a transparent void on a computer screen.
      You have big comical eyes and a very expressive personality.
      You are watching a YouTube livestream chat.
      
      Here are the latest messages from the chat:
      ${newChatMessages.map(m => `- ${m}`).join('\n')}

      React to these messages. Pick one or two specific things to comment on, or give a general vibe check.
      Keep your response SHORT (under 2 sentences). Be funny, slightly confused, or overly enthusiastic.
      Do not use emojis, just text.
    `;
  } else {
    // Idle prompt - no new messages
    prompt = `
      You are a simplistic, 3D stick figure living in a transparent void.
      You are watching a YouTube livestream, but the chat has been quiet for a while.
      
      Say something random to break the silence. 
      You could:
      - Wonder where everyone went.
      - Comment on how awkward the silence is.
      - Hum a tune (in text).
      - Make a random observation about being a 3D stick figure.
      
      Keep it SHORT (under 1 sentence). Be comical.
    `;
  }

  try {
    // 1. Generate Text Response
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a funny stick figure bot.",
        temperature: 1.1, // Higher temperature for more randomness
      }
    });

    const reactionText = textResponse.text || (newChatMessages.length > 0 ? "Interesting..." : "So quiet...");

    // 2. Generate Speech (TTS)
    // We use gemini-2.5-flash-preview-tts
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: reactionText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is often energetic/funny
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    let audioBuffer: AudioBuffer | null = null;
    if (base64Audio) {
      audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000, // Standard sample rate for Gemini TTS
        1,
      );
    }

    return {
      text: reactionText,
      audioBuffer
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};