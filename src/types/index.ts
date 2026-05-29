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

export interface DownloadTask {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  videoInfo?: VideoInfo;
  downloadedPath?: string;
  errorMessage?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
}

export interface Platform {
  name: string;
  icon: string;
  url: string;
}

export interface VideoSummary {
  title: string;
  duration: string;
  thumbnail: string;
  outline: string[];
  keyPoints: string[];
  content: string;
}

export type SummaryMode = 'brief' | 'detailed' | 'outline';
