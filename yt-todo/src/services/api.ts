import type { Playlist, Video } from '../types';

export const DEFAULT_API_BASE = 'https://pipedapi.kavin.rocks';

export const extractPlaylistId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        const listId = urlObj.searchParams.get('list');
        if (listId) return listId;
        return null;
    } catch (e) {
        // Allow user to paste just the ID
        if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;
        return null;
    }
};

const MOCK_PLAYLIST: Playlist = {
    id: 'mock-id',
    title: 'Demo Playlist: React Tutorial',
    uploader: 'Net Ninja',
    description: 'A demo playlist showcasing the app.',
    videos: [
        { title: 'React Tutorial #1 - Introduction', url: '/watch?v=playlist_video_1', duration: 300, thumbnail: 'https://i.ytimg.com/vi/j942wKiXFu8/hqdefault.jpg', uploader: 'Net Ninja' },
        { title: 'React Tutorial #2 - Creating a React App', url: '/watch?v=playlist_video_2', duration: 450, thumbnail: 'https://i.ytimg.com/vi/9D7g_L_hbn8/hqdefault.jpg', uploader: 'Net Ninja' },
        { title: 'React Tutorial #3 - Components & Templates', url: '/watch?v=playlist_video_3', duration: 520, thumbnail: 'https://i.ytimg.com/vi/1w1q_K5g_5g/hqdefault.jpg', uploader: 'Net Ninja' },
        { title: 'React Tutorial #4 - Dynamic Values', url: '/watch?v=playlist_video_4', duration: 380, thumbnail: 'https://i.ytimg.com/vi/pnhO8UaCgxg/hqdefault.jpg', uploader: 'Net Ninja' },
        { title: 'React Tutorial #5 - Multiple Components', url: '/watch?v=playlist_video_5', duration: 410, thumbnail: 'https://i.ytimg.com/vi/0sSYCg46AuA/hqdefault.jpg', uploader: 'Net Ninja' },
    ],
    nextpage: undefined
};

// Parse ISO 8601 duration (PT#H#M#S) to seconds
const parseDuration = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
};

// Fetch using YouTube Data API v3
const fetchWithYouTubeAPI = async (playlistId: string, apiKey: string): Promise<Playlist> => {
    // First, get playlist metadata
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) {
        const err = await playlistRes.json();
        throw new Error(err.error?.message || `YouTube API Error: ${playlistRes.status}`);
    }
    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error('Playlist not found');
    }

    const playlistInfo = playlistData.items[0].snippet;

    // Then, get playlist items (videos)
    let allVideos: Video[] = [];
    let nextPageToken = '';

    do {
        const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const itemsRes = await fetch(itemsUrl);
        if (!itemsRes.ok) {
            const err = await itemsRes.json();
            throw new Error(err.error?.message || `YouTube API Error: ${itemsRes.status}`);
        }
        const itemsData = await itemsRes.json();

        // Get video IDs to fetch durations
        const videoIds = itemsData.items
            .filter((item: any) => item.snippet.resourceId.kind === 'youtube#video')
            .map((item: any) => item.snippet.resourceId.videoId)
            .join(',');

        // Fetch video details for durations
        let durations: { [key: string]: number } = {};
        if (videoIds) {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
            const videosRes = await fetch(videosUrl);
            if (videosRes.ok) {
                const videosData = await videosRes.json();
                videosData.items.forEach((v: any) => {
                    durations[v.id] = parseDuration(v.contentDetails.duration);
                });
            }
        }

        const videos: Video[] = itemsData.items
            .filter((item: any) => item.snippet.resourceId.kind === 'youtube#video')
            .map((item: any) => {
                const videoId = item.snippet.resourceId.videoId;
                return {
                    title: item.snippet.title,
                    url: `/watch?v=${videoId}`,
                    duration: durations[videoId] || 0,
                    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    uploader: item.snippet.videoOwnerChannelTitle || playlistInfo.channelTitle
                };
            });

        allVideos = allVideos.concat(videos);
        nextPageToken = itemsData.nextPageToken || '';

    } while (nextPageToken);

    return {
        id: playlistId,
        title: playlistInfo.title,
        uploader: playlistInfo.channelTitle,
        description: playlistInfo.description || '',
        videos: allVideos,
        nextpage: undefined
    };
};

// Fetch using Piped/Invidious (fallback)
const fetchWithPipedOrInvidious = async (playlistId: string, baseUrl: string): Promise<Playlist> => {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    let targetUrl = `${cleanBaseUrl}/playlists/${playlistId}`;
    let isInvidious = false;

    let response = await fetch(targetUrl);

    if (response.status === 404 || !response.ok) {
        const invidiousUrl = `${cleanBaseUrl}/api/v1/playlists/${playlistId}`;
        try {
            const responseInv = await fetch(invidiousUrl);
            if (responseInv.ok) {
                response = responseInv;
                isInvidious = true;
            }
        } catch (e) { /* ignore */ }
    }

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    let videos: Video[] = [];
    let title = '';
    let uploader = '';
    let description = '';
    let id = playlistId;

    if (isInvidious) {
        title = data.title;
        uploader = data.author;
        description = data.description || '';
        id = data.plid || playlistId;
        videos = (data.videos || []).map((v: any) => ({
            title: v.title,
            url: `/watch?v=${v.videoId}`,
            duration: v.lengthSeconds,
            thumbnail: v.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            uploader: v.author
        }));
    } else {
        title = data.name;
        uploader = data.uploader;
        description = data.description || '';
        id = data.uuid || playlistId;
        videos = (data.relatedStreams || []).map((v: any) => ({
            title: v.title,
            url: v.url,
            duration: v.duration,
            thumbnail: v.thumbnail,
            uploader: v.uploaderName
        }));
    }

    return { id, title, uploader, description, videos, nextpage: undefined };
};

export const fetchPlaylist = async (
    playlistId: string,
    baseUrl: string = DEFAULT_API_BASE,
    youtubeApiKey?: string
): Promise<Playlist> => {
    if (playlistId === 'demo') {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_PLAYLIST), 500));
    }

    // If YouTube API key is provided and valid-looking, use YouTube API
    if (youtubeApiKey && youtubeApiKey.length > 20) {
        return fetchWithYouTubeAPI(playlistId, youtubeApiKey);
    }

    // Otherwise, try Piped/Invidious
    return fetchWithPipedOrInvidious(playlistId, baseUrl);
};
