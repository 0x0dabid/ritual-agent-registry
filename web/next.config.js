/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable Ritual Chain environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Image optimization config
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
}

module.exports = nextConfig
