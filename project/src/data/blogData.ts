export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tag: string;
  image: string;
  excerpt: string;
  slug: string;
  isTopPick?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Future of AI in Business: A Comprehensive Guide",
    date: "16 Aug 2025",
    tag: "AI Strategy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Explore how artificial intelligence is transforming modern business operations and what it means for your company's future.",
    slug: "future-ai-business-comprehensive-guide",
    isTopPick: true,
  },
  {
    id: "2",
    title: "Building Scalable Machine Learning Pipelines",
    date: "16 Aug 2025",
    tag: "ML Engineering",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Learn the best practices for creating robust and scalable machine learning pipelines that can handle production workloads.",
    slug: "building-scalable-machine-learning-pipelines",
    isTopPick: true,
  },
  {
    id: "3",
    title: "Custom LLM Development: From Concept to Deployment",
    date: "16 Aug 2025",
    tag: "LLM Development",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "A deep dive into developing custom large language models tailored to your specific business needs and use cases.",
    slug: "custom-llm-development-concept-deployment",
    isTopPick: true,
  },
  {
    id: "4",
    title: "Data Privacy in AI: Compliance and Best Practices",
    date: "16 Aug 2025",
    tag: "Privacy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Understanding data privacy regulations and implementing best practices for AI systems in regulated industries.",
    slug: "data-privacy-ai-compliance-best-practices",
  },
  {
    id: "5",
    title: "Generative AI Tools for Content Creation",
    date: "16 Aug 2025",
    tag: "Content AI",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Discover how generative AI tools are revolutionizing content creation workflows and boosting productivity.",
    slug: "generative-ai-tools-content-creation",
  },
  {
    id: "6",
    title: "AI Ethics: Building Responsible AI Systems",
    date: "16 Aug 2025",
    tag: "AI Ethics",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Exploring the ethical considerations in AI development and how to build systems that are fair, transparent, and accountable.",
    slug: "ai-ethics-building-responsible-ai-systems",
  },
  {
    id: "7",
    title: "Edge AI: Bringing Intelligence to the Edge",
    date: "16 Aug 2025",
    tag: "Edge Computing",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Understanding edge AI technologies and their applications in IoT, mobile devices, and real-time processing scenarios.",
    slug: "edge-ai-bringing-intelligence-edge",
  },
  {
    id: "8",
    title: "AI Model Optimization: Performance and Efficiency",
    date: "16 Aug 2025",
    tag: "Model Optimization",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Techniques for optimizing AI models to improve performance, reduce computational costs, and enhance efficiency.",
    slug: "ai-model-optimization-performance-efficiency",
  },
  {
    id: "9",
    title: "The Business Case for AI Investment",
    date: "16 Aug 2025",
    tag: "Business Strategy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "How to build a compelling business case for AI investment and measure ROI in AI initiatives.",
    slug: "business-case-ai-investment",
  },
  {
    id: "10",
    title: "Edge AI: Bringing Intelligence to the Edge",
    date: "16 Aug 2025",
    tag: "Edge Computing",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Understanding edge AI technologies and their applications in IoT, mobile devices, and real-time processing scenarios.",
    slug: "edge-ai-bringing-intelligence-edge",
  },
  {
    id: "11",
    title: "AI Model Optimization: Performance and Efficiency",
    date: "16 Aug 2025",
    tag: "Model Optimization",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "Techniques for optimizing AI models to improve performance, reduce computational costs, and enhance efficiency.",
    slug: "ai-model-optimization-performance-efficiency",
  },
  {
    id: "12",
    title: "The Business Case for AI Investment",
    date: "16 Aug 2025",
    tag: "Business Strategy",
    image: "https://res.cloudinary.com/dieth2xb3/image/upload/v1755804235/aaaimage_zbypst.png",
    excerpt:
      "How to build a compelling business case for AI investment and measure ROI in AI initiatives.",
    slug: "business-case-ai-investment",
  },
];

export const blogTags = [
  "All",
  "AI Strategy",
  "ML Engineering",
  "LLM Development",
  "Privacy",
  "Content AI",
  "AI Ethics",
  "Edge Computing",
  "Model Optimization",
  "Business Strategy",
];
