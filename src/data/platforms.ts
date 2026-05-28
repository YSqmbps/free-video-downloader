export const platforms = [
  { name: 'YouTube', icon: 'youtube', url: 'https://youtube.com' },
  { name: 'Bilibili', icon: 'bilibili', url: 'https://bilibili.com' },
  { name: '抖音', icon: 'douyin', url: 'https://douyin.com' },
  { name: '快手', icon: 'kuaishou', url: 'https://kuaishou.com' },
  { name: 'TikTok', icon: 'tiktok', url: 'https://tiktok.com' },
  { name: 'Vimeo', icon: 'vimeo', url: 'https://vimeo.com' },
  { name: 'Twitter', icon: 'twitter', url: 'https://twitter.com' },
  { name: 'Instagram', icon: 'instagram', url: 'https://instagram.com' },
  { name: 'Facebook', icon: 'facebook', url: 'https://facebook.com' },
  { name: '网易云音乐', icon: 'netease', url: 'https://music.163.com' },
  { name: 'QQ音乐', icon: 'qqmusic', url: 'https://y.qq.com' },
  { name: '小红书', icon: 'xiaohongshu', url: 'https://xiaohongshu.com' },
];

export const pricingPlans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    description: '适合偶尔下载的用户',
    features: [
      '每天3次下载机会',
      '最高720P画质',
      '基础格式支持(MP4)',
      '无批量下载',
      '无字幕翻译',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro版',
    price: 19,
    period: '月',
    description: '适合经常下载的用户',
    features: [
      '无限下载次数',
      '最高4K画质',
      '全格式支持(MP4/MP3/MKV)',
      '批量下载(最多10个)',
      '字幕翻译功能',
      '优先技术支持',
    ],
    popular: true,
  },
  {
    id: 'vip',
    name: 'VIP版',
    price: 99,
    period: '年',
    description: '最受欢迎的选择',
    features: [
      '无限下载次数',
      '最高8K画质',
      '全格式支持',
      '无限批量下载',
      'AI视频总结',
      '字幕翻译+导出',
      '专属客服',
      '高级去水印',
    ],
    popular: false,
  },
];

export const features = [
  {
    icon: 'download',
    title: '极速下载',
    description: '采用多线程技术，下载速度提升300%，让你更快获取视频资源',
  },
  {
    icon: 'globe',
    title: '全球平台支持',
    description: '支持YouTube、B站、抖音、快手等1000+主流视频平台',
  },
  {
    icon: 'quality',
    title: '高清画质',
    description: '支持4K/8K超清画质下载，保留原始视频质量',
  },
  {
    icon: 'translate',
    title: '字幕翻译',
    description: '自动识别字幕并翻译为多种语言，学习更轻松',
  },
  {
    icon: 'batch',
    title: '批量下载',
    description: '一键添加多个视频链接，批量处理省时省力',
  },
  {
    icon: 'mobile',
    title: '移动端支持',
    description: '完美适配手机和平板，随时随地下载视频',
  },
];
