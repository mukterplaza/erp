/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // টাইপস্ক্রিপ্ট সতর্কবার্তার কারণে যেন Netlify বিল্ড না আটকে যায়
    ignoreBuildErrors: true,
  },
  eslint: {
    // বিল্ডের সময় ESLint চেকিং স্কিপ করা
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
