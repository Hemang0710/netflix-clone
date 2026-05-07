import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol:"https",
        hostname:"*.amazonaws.com",
        pathname:"/**",
      },
    ],
  },
  serverExternalPackages:["@prisma/client", "bcryptjs", "jsonwebtoken"],
  turbopack: {}
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true
});

export default withPWAConfig(nextConfig);
