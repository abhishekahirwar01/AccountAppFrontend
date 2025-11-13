import { Section } from 'lucide-react';
import HeroSection from '../components/homePage/HeroSection';
// import list from '../components/homePage/list';
import Footer from '../components/homePage/Footer';


import List from "../components/homePage/list";
import FourthSection from "../components/homePage/FourthSection";

// import  Hero from  '../components/homePage/HeroSection';
import Faq from '../components/homePage/Faq';
import Gogst from '../components/homePage/Gogst';



export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
      {/* <HeroSection /> */}
      <HeroSection/>
      <List />
      <FourthSection />
      <Faq />
      <Gogst />
      <Footer />

    </main>
  );
}
