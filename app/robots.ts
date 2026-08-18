import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/debug",
          "/api",
          "/deployment-check",
          "/demo",
          "/invite",
        ],
      },
    ],
  };
}
