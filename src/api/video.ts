const API_BASE_URL = 'http://localhost:3001/api';

export interface VideoInfo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  id: string;
  format: string;
  resolution: string;
  size: string;
  ext: string;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const response = await fetch(`${API_BASE_URL}/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || '获取视频信息失败');
  }
  
  return data.info;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
