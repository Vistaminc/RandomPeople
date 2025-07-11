/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // 在生产环境中禁用严格模式
  reactStrictMode: process.env.NODE_ENV === 'development',
  // 配置基础路径
  basePath: '',
  // 禁用默认的 X-Powered-By 头
  poweredByHeader: false,
  distDir: 'out',
  assetPrefix: './'
}

module.exports = nextConfig 