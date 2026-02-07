export interface Video {
    title: string;
    url: string;
    duration: number; // in seconds
    thumbnail: string;
    uploader: string;
}

export interface Playlist {
    id: string;
    title: string;
    uploader: string;
    description: string;
    videos: Video[];
    nextpage?: string; // for pagination if needed
}

export interface TodoItem extends Video {
    id: string; // unique id (can use video url or generate one)
    isCompleted: boolean;
    addedAt: number;
}
