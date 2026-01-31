// Hardcoded key provided by user request
const YOUTUBE_API_KEY = "AIzaSyCkOViNJXjx7QlMe5DsdSt2Vx65CQECIIA";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface ChatMessage {
  id: string;
  author: string;
  message: string;
  publishedAt: string;
}

export const getLiveChatId = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const details = data.items[0].liveStreamingDetails;
      return details?.activeLiveChatId || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching live chat ID:", error);
    return null;
  }
};

export const fetchChatMessages = async (liveChatId: string, pageToken?: string) => {
  try {
    let url = `${BASE_URL}/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${YOUTUBE_API_KEY}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.warn("YouTube API Error:", data.error.message);
      return { messages: [], nextPageToken: null, pollingInterval: 5000 };
    }

    const messages: ChatMessage[] = (data.items || []).map((item: any) => ({
      id: item.id,
      author: item.authorDetails.displayName,
      message: item.snippet.displayMessage,
      publishedAt: item.snippet.publishedAt,
    }));

    return {
      messages,
      nextPageToken: data.nextPageToken,
      pollingInterval: data.pollingIntervalMillis || 5000,
    };
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return { messages: [], nextPageToken: null, pollingInterval: 10000 };
  }
};