/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images: allow Supabase storage domain once configured
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
