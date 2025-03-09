import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.ts$/,
        include: /workers/,
        use: [{ loader: "worker-loader" }],
      });
    }
    return config;
  },
};

export default nextConfig;
