import type { Metadata } from "next";

export const siteConfig = {
  name: "Ionio",
  description: "AI innovation company driven by people and powered by technology to deliver impactful AI solutions",
  url: "https://ionio.com",
  ogImage: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png",
  logo: "https://ionio.com/logo.png",
  keywords: [
    "AI innovation",
    "artificial intelligence",
    "machine learning",
    "technology solutions",
    "AI consulting",
    "machine learning engineering",
    "LLM development",
    "AI strategy"
  ],
  authors: [
    {
      name: "Ionio Team",
      url: "https://ionio.com",
    },
  ],
  creator: "Ionio",
  publisher: "Ionio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ionio.com",
    siteName: "Ionio",
    title: "Ionio - AI Innovation & Technology Solutions",
    description: "AI innovation company driven by people and powered by technology to deliver impactful AI solutions",
    images: [
      {
        url: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png",
        width: 1200,
        height: 630,
        alt: "Ionio - AI Innovation & Technology Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ionio - AI Innovation & Technology Solutions",
    description: "AI innovation company driven by people and powered by technology to deliver impactful AI solutions",
    images: ["https://res.cloudinary.com/dieth2xb3/image/upload/v1755799085/ssimage_bxr8i6.png"],
    creator: "@ionio",
  },
  verification: {
    google: "your-google-verification-code", 
  },
  alternates: {
    canonical: "https://ionio.com",
  },
  category: "technology",
};


export const pageMetadata = {
  home: {
    title: "Ionio - AI Innovation & Technology Solutions",
    description: "Transform your business with cutting-edge AI solutions. Ionio delivers innovative artificial intelligence technologies that drive growth and efficiency.",
    keywords: [
      "AI solutions",
      "artificial intelligence consulting",
      "machine learning services",
      "AI innovation",
      "technology transformation",
      "business AI",
      "AI strategy"
    ],
    openGraph: {
      title: "Ionio - AI Innovation & Technology Solutions",
      description: "Transform your business with cutting-edge AI solutions. Ionio delivers innovative artificial intelligence technologies that drive growth and efficiency.",
      url: "https://ionio.com",
      type: "website",
    },
    twitter: {
      title: "Ionio - AI Innovation & Technology Solutions",
      description: "Transform your business with cutting-edge AI solutions. Ionio delivers innovative artificial intelligence technologies that drive growth and efficiency.",
    },
    alternates: {
      canonical: "https://ionio.com",
    },
  },
  about: {
    title: "About Ionio - AI Innovation & Technology Solutions",
    description: "Learn about Ionio's story, culture, and expertise in AI innovation. We are driven by people and powered by AI technology to deliver impactful solutions.",
    keywords: [
      "Ionio",
      "AI innovation",
      "technology solutions",
      "artificial intelligence",
      "machine learning",
      "company culture",
      "team expertise",
      "AI company story"
    ],
    openGraph: {
      title: "About Ionio - AI Innovation & Technology Solutions",
      description: "Learn about Ionio's story, culture, and expertise in AI innovation. We are driven by people and powered by AI technology to deliver impactful solutions.",
      url: "https://ionio.com/about",
      type: "website",
    },
    twitter: {
      title: "About Ionio - AI Innovation & Technology Solutions",
      description: "Learn about Ionio's story, culture, and expertise in AI innovation. We are driven by people and powered by AI technology to deliver impactful solutions.",
    },
    alternates: {
      canonical: "https://ionio.com/about",
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Ionio",
      "description": "AI innovation company driven by people and powered by technology to deliver impactful AI solutions",
      "url": "https://ionio.com",
      "logo": "https://ionio.com/logo.png",
      "foundingDate": "2016",
      "numberOfEmployees": "50-100",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      },
      "sameAs": [
        "https://linkedin.com/company/ionio",
        "https://twitter.com/ionio"
      ],
      "knowsAbout": [
        "Artificial Intelligence",
        "Machine Learning",
        "AI Solutions",
        "Technology Innovation"
      ]
    }
  },
  blog: {
    title: "AI Insights & Research - Ionio Blog",
    description: "Stay updated with the latest trends, research, and insights in artificial intelligence, machine learning, and emerging technologies that are shaping the future of business.",
    keywords: [
      "AI blog",
      "artificial intelligence insights",
      "machine learning research",
      "AI trends",
      "technology insights",
      "AI articles",
      "ML engineering",
      "LLM development"
    ],
    openGraph: {
      title: "AI Insights & Research - Ionio Blog",
      description: "Stay updated with the latest trends, research, and insights in artificial intelligence, machine learning, and emerging technologies that are shaping the future of business.",
      url: "https://ionio.com/blog",
      type: "website",
    },
    twitter: {
      title: "AI Insights & Research - Ionio Blog",
      description: "Stay updated with the latest trends, research, and insights in artificial intelligence, machine learning, and emerging technologies that are shaping the future of business.",
    },
    alternates: {
      canonical: "https://ionio.com/blog",
    },
  },
};

export function generatePageMetadata(
  page: keyof typeof pageMetadata,
  customMetadata?: Partial<Metadata>
): Metadata {
  const baseMetadata = pageMetadata[page];
  
  return {
    title: baseMetadata.title,
    description: baseMetadata.description,
    keywords: baseMetadata.keywords,
    openGraph: {
      ...siteConfig.openGraph,
      ...baseMetadata.openGraph,
    },
    twitter: {
      ...siteConfig.twitter,
      ...baseMetadata.twitter,
    },
    alternates: baseMetadata.alternates,
    robots: siteConfig.robots,
    verification: siteConfig.verification,
    ...customMetadata,
  };
}


export function generateBlogPostMetadata(
  title: string,
  description: string,
  publishedTime: string,
  slug: string,
  image?: string
): Metadata {
  const blogUrl = `https://ionio.com/blog/${slug}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title: `${title} - Ionio Blog`,
    description,
    keywords: [
      ...siteConfig.keywords,
      "AI blog post",
      "artificial intelligence article",
      "machine learning insights"
    ],
    openGraph: {
      ...siteConfig.openGraph,
      title: `${title} - Ionio Blog`,
      description,
      url: blogUrl,
      type: "article",
      publishedTime,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...siteConfig.twitter,
      title: `${title} - Ionio Blog`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: blogUrl,
    },
    robots: siteConfig.robots,
  };
}


export function generateBlogPostStructuredData(
  title: string,
  description: string,
  publishedTime: string,
  slug: string,
  author?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    datePublished: publishedTime,
    dateModified: publishedTime,
    description,
    url: `https://ionio.com/blog/${slug}`,
    author: {
      "@type": "Person",
      name: author || "Ionio Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Ionio",
      logo: {
        "@type": "ImageObject",
        url: siteConfig.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://ionio.com/blog/${slug}`,
    },
  };
}


export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  robots: siteConfig.robots,
  openGraph: siteConfig.openGraph,
  twitter: siteConfig.twitter,
  verification: siteConfig.verification,
  alternates: siteConfig.alternates,
  category: siteConfig.category,
};
