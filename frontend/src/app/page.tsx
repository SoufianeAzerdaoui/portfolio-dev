import { PortfolioHome } from "@/components/portfolio/portfolio-home";
import { getFeaturedProjects } from "@/features/projects/queries/project.queries";

export default async function Home() {
  const featuredProjects = await getFeaturedProjects(3);

  return <PortfolioHome featuredProjects={featuredProjects} />;
}
