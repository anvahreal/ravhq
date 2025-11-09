import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const Success = () => {
  const location = useLocation();
  const [animate, setAnimate] = useState(false);
  
  const { amount = 0, reference = "N/A", txHash = null, network="celo" } = location.state || {};

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setAnimate(true), 100);
  }, []);

const explorerLinks = {
  celo: "https://explorer.celo.org/alfajores/tx/", // Celo testnet
  base: "https://sepolia.basescan.org/tx/",        // Base testnet
  ethereum: "https://sepolia.etherscan.io/tx/",    // Ethereum testnet
  polygon: "https://mumbai.polygonscan.com/tx/",   // Polygon testnet
  avalanche: "https://testnet.snowtrace.io/tx/",   // Avalanche testnet
};


  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center">
            <div className={`transform transition-all duration-500 ${
              animate ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Transaction Successful!
              </h1>
              
              <p className="text-muted-foreground mb-8">
                Your payment has been processed on the blockchain
              </p>

              <div className="bg-muted/50 p-6 rounded-lg mb-8 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${amount.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {reference}
                  </p>
                </div>

                {txHash && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Blockchain Transaction</p>
                    <a 
                      href={`${explorerLinks[network] || explorerLinks.celo}${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline break-all"
                    >
                      {txHash}
                    </a>
                  </div>
                )}

                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Network</p>
                    <p className="text-sm font-medium capitalize text-foreground">
                      {network}
                    </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Confirmed
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-12" asChild>
                  <Link to="/dashboard">Back to Dashboard</Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/payment">New Payment</Link>
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Transaction recorded on the blockchain</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;
