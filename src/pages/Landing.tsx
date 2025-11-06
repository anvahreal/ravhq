import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scan, CheckCircle, Zap, Shield, Globe, TrendingUp } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
            Reliable Access via Blockchain
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            We help small merchants across Africa accept stable coin payments easily — no POS, no complexity, just scan & get paid
          </p>
          <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto" asChild>
            <Link to="/dashboard">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted/30 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-foreground px-2">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">1. Create Invoice + QR / Link</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Input amount and description → generate QR & link
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">2. Customer Pays with Wallet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  They scan or click → open their wallet EVM compatible wallet and confirm
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">3. Confirmation & Dashboard</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Payment confirmed on-chain, receipt sent, sale recorded in your dashboard
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Rav Section */}
      <section id="why-rav" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Why Rav?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Trust</h3>
                <p className="text-muted-foreground">
                  Built on blockchain with transparent, immutable transaction records.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Access</h3>
                <p className="text-muted-foreground">
                  Banking the unbanked with mobile-first solutions accessible to everyone.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Reliability</h3>
                <p className="text-muted-foreground">
                  Low fees, instant settlements, and 99.9% uptime for your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2">
            Ready to get started?
          </h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4">
            Join thousands of merchants using Rav for reliable digital payments.
          </p>
          <Button size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto" asChild>
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
