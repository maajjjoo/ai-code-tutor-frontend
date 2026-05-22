import { usePageTitle } from '../hooks/usePageTitle';
import { Navbar } from '../components/home/Navbar';
import { HeroSection } from '../components/home/HeroSection';
import { ModesSection } from '../components/home/ModesSection';
import { FeaturesRow } from '../components/home/FeaturesRow';
import { Footer } from '../components/home/Footer';

export function HomePage() {
  usePageTitle('Home');
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ModesSection />
        <FeaturesRow />
      </main>
      <Footer />
    </div>
  );
}
