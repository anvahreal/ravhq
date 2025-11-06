import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QRCode from "@/components/QRCode";
import { Copy, ExternalLink, Wallet, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorHandler";

const Payment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [merchantId, setMerchantId] = useState<string>("");
  const [paymentLink, setPaymentLink] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        setMerchantId(session.user.id);
        const link = `${window.location.origin}/pay/${session.user.id}`;
        setPaymentLink(link);

        // Fetch wallet address
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.wallet_address) {
          setWalletAddress(profile.wallet_address);
        }
      }
    };
    checkAuth();
  }, [navigate, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast({
      title: "Link copied!",
      description: "Payment link copied to clipboard",
    });
  };

  const handleSaveWallet = async () => {
    if (!walletAddress.trim()) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid Celo wallet address",
        variant: "destructive",
      });
      return;
    }

    <QRCode
  value={walletAddress || paymentLink}
  label={walletAddress || "No wallet set"}
  size={window.innerWidth < 640 ? 200 : 240}
/>


    // Basic validation for Ethereum/Celo address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast({
        title: "Invalid address format",
        description: "Wallet address must be a valid Ethereum/Celo address (0x...)",
        variant: "destructive",
      });
      return;
    }

    setIsSavingWallet(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: merchantId,
          merchant_name: user?.user_metadata?.merchant_name || 'Merchant',
          wallet_address: walletAddress 
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Wallet saved!",
        description: "Your Evm wallet address has been updated",
      });
      setIsEditingWallet(false);
    } catch (error: any) {
      toast({
        title: "Failed to save wallet",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingWallet(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 sm:py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Your Payment Link & QR Code
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Share with customers to receive payments
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Wallet Address Setup */}
            <Card className="p-5 sm:p-6 bg-primary/5 border-primary/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    Evm Wallet Address
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {walletAddress 
                  ? "Customers will send payments to this wallet address" 
                  : "Set up your Celo wallet address to receive payments"}
              </p>
              
              {isEditingWallet || !walletAddress ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="walletAddress" className="text-sm">Wallet Address</Label>
                    <Input
                      id="walletAddress"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="h-11 mt-1.5 font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveWallet}
                      disabled={isSavingWallet}
                      className="h-10"
                    >
                      {isSavingWallet ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Address
                        </>
                      )}
                    </Button>
                    {walletAddress && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingWallet(false)}
                        className="h-10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="font-mono text-xs sm:text-sm text-foreground break-all">
                      {walletAddress}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingWallet(true)}
                    className="h-10"
                  >
                    Update Address
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <QRCode value={paymentLink} size={window.innerWidth < 640 ? 200 : 240} />
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Customers scan this code to pay you
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      Your Payment Link
                    </p>
                    <p className="font-mono text-xs sm:text-sm text-foreground break-all">
                      {paymentLink}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      className="w-full h-11 text-sm"
                      onClick={handleCopyLink}
                    >
                      <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Copy Link</span>
                      <span className="xs:hidden">Copy</span>
                    </Button>
                    <Button variant="outline" className="w-full h-11 text-sm" asChild>
                      <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1 sm:mr-2" />
                        Preview
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 bg-primary/5 border-primary/20">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                Manage Your Products
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Add products and services so customers can select what to pay for
              </p>
              <Button asChild className="w-full sm:w-auto h-11">
                <Link to="/products">Manage Products</Link>
              </Button>
            </Card>
          </div>

          <div className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
            <p>Powered by blockchain • Instant settlement • Low fees</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
