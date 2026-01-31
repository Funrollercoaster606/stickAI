import React, { useState, useEffect, useRef, useCallback } from 'react';
import Experience from './components/Experience';
import { getLiveChatId, fetchChatMessages, ChatMessage } from './services/youtubeService';
import { generateReaction } from './services/geminiService';

// The default video ID from the prompt
const DEFAULT_VIDEO_ID = "fZqITgdQX_8";
const IDLE_TIMEOUT_MS = 15000; // Speak every 15 seconds if idle

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState<string>("");
  
  // Refs for logic loop
  const liveChatIdRef = useRef<string | null>(null);
  const nextPageTokenRef = useRef<string | undefined>(undefined);
  const pollingIntervalRef = useRef<number>(5000);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const lastReactionTimeRef = useRef<number>(Date.now());

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      setHasStarted(true);
      startYouTubeLoop();
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      setHasStarted(true);
    }
  };

  const startYouTubeLoop = async () => {
    const chatId = await getLiveChatId(DEFAULT_VIDEO_ID);
    if (chatId) {
      liveChatIdRef.current = chatId;
      pollChat();
    } else {
      console.error("Could not find live chat.");
    }
  };

  const pollChat = useCallback(async () => {
    if (!liveChatIdRef.current) return;

    const { messages, nextPageToken, pollingInterval } = await fetchChatMessages(
      liveChatIdRef.current,
      nextPageTokenRef.current
    );

    nextPageTokenRef.current = nextPageToken;
    pollingIntervalRef.current = pollingInterval;

    if (messages.length > 0) {
      const messageTexts = messages.map((m: ChatMessage) => `${m.author}: ${m.message}`);
      pendingMessagesRef.current = [...pendingMessagesRef.current, ...messageTexts];
    }

    // Schedule next poll
    setTimeout(pollChat, Math.max(pollingIntervalRef.current, 5000));
  }, []);

  // AI Reaction Loop
  useEffect(() => {
    const reactionLoop = async () => {
      if (!audioContextRef.current || isProcessingRef.current) {
        setTimeout(reactionLoop, 1000);
        return;
      }

      const now = Date.now();
      const timeSinceLastReaction = now - lastReactionTimeRef.current;
      const hasPendingMessages = pendingMessagesRef.current.length > 0;
      const shouldSpeakIdle = timeSinceLastReaction > IDLE_TIMEOUT_MS;

      // Only proceed if we have messages OR it's time to speak idly
      if (!hasPendingMessages && !shouldSpeakIdle) {
         setTimeout(reactionLoop, 1000);
         return;
      }

      isProcessingRef.current = true;

      // Take a batch of messages (if any)
      const batch = pendingMessagesRef.current.splice(0, pendingMessagesRef.current.length);
      
      try {
        const result = await generateReaction(batch, audioContextRef.current);

        if (result && result.audioBuffer) {
           setSubtitle(result.text);
           setIsSpeaking(true);

           const source = audioContextRef.current.createBufferSource();
           source.buffer = result.audioBuffer;
           source.connect(audioContextRef.current.destination);
           
           source.onended = () => {
             setIsSpeaking(false);
             setSubtitle(""); // Clear subtitle after speaking
           };
           
           source.start();
           
           // Update last reaction time
           lastReactionTimeRef.current = Date.now();
        }
      } catch (e) {
        console.error("Reaction generation failed", e);
      } finally {
        isProcessingRef.current = false;
        // Wait a bit before next check to prevent overlapping thoughts
        setTimeout(reactionLoop, 3000);
      }
    };

    if (hasStarted) {
      reactionLoop();
    }
  }, [hasStarted]);

  return (
    <div className="w-screen h-screen relative overflow-hidden flex flex-col justify-end items-center">
      
      {/* Click overlay to start (Invisible after start) */}
      {!hasStarted && (
        <div 
          onClick={initAudio}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 cursor-pointer"
        >
          <div className="text-white text-2xl font-bold animate-pulse">
            CLICK ANYWHERE TO START
          </div>
        </div>
      )}

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Experience isSpeaking={isSpeaking} />
      </div>

      {/* UI Layer - Subtitles only */}
      <div className="z-10 w-full mb-12 flex flex-col items-center pointer-events-none">
        {subtitle && (
          <div className="bg-white/90 text-black px-6 py-4 rounded-2xl shadow-xl text-xl font-bold max-w-lg text-center border-2 border-black animate-bounce-short">
            "{subtitle}"
          </div>
        )}
      </div>
    </div>
  );
};

export default App;