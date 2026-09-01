import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本项目仅支持服务器部署（Docker / 裸机），standalone 输出用于 Docker 镜像
  output: 'standalone',
  
  // 启用压缩
  compress: true,
  
  // 安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
