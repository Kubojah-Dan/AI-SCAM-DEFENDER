import CyberScene from "../sections/CyberScene";
import Features from "../sections/Features";
import Footer from "../sections/Footer";
import Hero from "../sections/Hero";
import SecurityPlaybook from "../sections/SecurityPlaybook";

export default function HomePage({ auth }) {
  return (
    <div className="home-page">
      <CyberScene />
      <div className="home-content">
        <Hero auth={auth} />
        <Features />
        <SecurityPlaybook />
        <Footer />
      </div>
    </div>
  );
}
