import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ShoppingCart, Wallet, Plus, Minus, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, isValidUUID } from "@/lib/errorHandler";
import { z } from "zod";
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

// Validation schema for payment inputs
const paymentSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .max(1000, "Quantity too large"),
  merchantId: z.string().uuid("Invalid merchant ID"),
});

const CustomerPayment = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [merchantName, setMerchantName] = useState("");
  const [merchantWalletAddress, setMerchantWalletAddress] = useState("");
  const [isMerchantVerified, setIsMerchantVerified] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletProvider, setWalletProvider] = useState<any>(null);

  useEffect(() => {
    const fetchMerchantData = async () => {
      if (!merchantId) return;

      // Validate merchantId is a valid UUID
      if (!isValidUUID(merchantId)) {
        toast({
          title: "Invalid merchant link",
          description: "This payment link is not valid",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      // Fetch merchant profile with security validation
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("merchant_name, wallet_address, created_at")
        .eq("id", merchantId)
        .maybeSingle();

      if (profileError) {
        toast({
          title: "Merchant not found",
          description: "Unable to load merchant information",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      if (!profileData) {
        toast({
          title: "Invalid payment link",
          description: "This merchant account does not exist",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      if (!profileData.wallet_address) {
        toast({
          title: "Merchant not configured",
          description: "This merchant has not set up payment receiving",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      // Validate merchant wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(profileData.wallet_address)) {
        toast({
          title: "Security Warning",
          description: "Merchant wallet address appears invalid",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      setMerchantName(profileData.merchant_name);
      setMerchantWalletAddress(profileData.wallet_address);
      
      // Merchant is verified if they have wallet set up and account exists
      const accountAge = Date.now() - new Date(profileData.created_at).getTime();
      setIsMerchantVerified(accountAge > 0);

      // Fetch active products - only select necessary columns
      const { data: productsData, error } = await supabase
        .from("products")
        .select("id, name, description, price")
        .eq("merchant_id", merchantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Unable to load products",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } else {
        setProducts(productsData || []);
      }
      setLoadingData(false);
    };

    fetchMerchantData();
  }, [merchantId, toast]);

  const connectWallet = async (useWalletConnect: boolean = false) => {
    setIsConnecting(true);
    try {
      let provider;
      let accounts;

      if (useWalletConnect) {
        // WalletConnect integration for mobile wallets
        const wcProvider = await EthereumProvider.init({
          projectId: "6f033f2737797ddd7f1907ba4c264474", // Public project ID
          chains: [42220], // Celo mainnet
          showQrModal: true,
          qrModalOptions: {
            themeMode: "dark",
          },
          rpcMap: {
            42220: "https://forno.celo.org",
          },
        });

        await wcProvider.enable();
        provider = new ethers.BrowserProvider(wcProvider);
        accounts = await wcProvider.request({ method: "eth_accounts" });
        setWalletProvider(wcProvider);
      } else {
        // Browser wallet (MetaMask, etc.)
        if (typeof window.ethereum === "undefined") {
          toast({
            title: "No browser wallet found",
            description: "Try using WalletConnect to connect your mobile wallet",
            variant: "destructive",
          });
          setIsConnecting(false);
          return;
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        accounts = await provider.send("eth_requestAccounts", []);
        
        // Check network
        const network = await provider.send("eth_chainId",[]);
          if (network !== "0xaef3") {
            toast({
              title: "Wrong Network",
              description: "Please switch to Celo Alfajore Testnet to continue.",
              variant: "destructive"
            });
            return
          }

        // Switch to Celo network
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaef3" }]); // ✅ Celo Alfajores / Sepolia testnet
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await provider.send("wallet_addEthereumChain", [{
          chainId: "0xaef3",
          chainName: "Celo Testnet",
          nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
          rpcUrls: ["https://alfajores-forno.celo-testnet.org"], // ✅ correct testnet RPC
          blockExplorerUrls: ["https://alfajores.celoscan.io"],
        }]);
      } else {
        throw switchError;
      }      
    }

        setWalletProvider(window.ethereum);
      }

      setWalletAddress(accounts[0]);
      toast({
        title: "Wallet connected securely",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePayment = async () => {
    // Validate inputs
    if (!selectedProduct) {
      toast({
        title: "No product selected",
        description: "Please select a product to continue",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      toast({
        title: "Product not found",
        description: "Selected product is no longer available",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = product.price * quantity;

    try {
      const validationData = paymentSchema.parse({
        customerName: customerName,
        quantity: quantity,
        merchantId: merchantId,
      });

      if (!walletAddress) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      // Validate merchant wallet before payment
      if (!merchantWalletAddress) {
        toast({
          title: "Merchant configuration error",
          description: "Merchant has not set up their wallet address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Security check: Verify merchant wallet hasn't changed
      const { data: merchantProfile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", merchantId)
        .maybeSingle();

      if (merchantProfile?.wallet_address !== merchantWalletAddress) {
        toast({
          title: "Security Alert",
          description: "Merchant wallet address has changed. Please refresh and verify.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Process Celo payment
      const provider = new ethers.BrowserProvider(walletProvider || window.ethereum);
      const signer = await provider.getSigner();

      // Convert USD to CELO (simplified - in production use an oracle)
      // For demo: 1 USD = 1 CELO (you should use a real price feed)
      const celoAmount = ethers.parseEther(totalAmount.toString());

      // ✅ Check wallet balance before sending
      const balance = await provider.getBalance(await signer.getAddress());
        if (balance < celoAmount) {
          throw new Error("Insufficient CELO balance for payment.")};

      // Send transaction on Celo blockchain with security checks
      const tx = await signer.sendTransaction({
        to: merchantWalletAddress,
        value: celoAmount,
      });

      toast({
        title: "Transaction sent",
        description: "Waiting for confirmation on Celo blockchain...",
      });

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed");
      }

      // Record transaction via edge function
      const { data, error } = await supabase.functions.invoke("record-payment", {
        body: {
          merchantId: merchantId,
          amount: totalAmount,
          customerName: validationData.customerName,
          productId: selectedProduct,
          quantity: quantity,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          fromAddress: walletAddress,
          toAddress: merchantWalletAddress,
        },
      });

      if (error) throw error;

      navigate("/success", {
        state: {
          amount: totalAmount,
          reference: data.reference_id,
          txHash: receipt.hash,
        },
      });
  } catch (error: any) {
    console.error("Payment error:", error);

    if (error instanceof z.ZodError) {
      toast({
        title: "Validation error",
        description: error.errors[0].message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  } finally {
    setLoading(false);
  }

  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {isMerchantVerified ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified Merchant
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Unverified Merchant
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              Secure Payment
            </Badge>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Pay {merchantName}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Select a product and choose quantity
            </p>
            {merchantWalletAddress && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Merchant: {merchantWalletAddress.slice(0, 8)}...{merchantWalletAddress.slice(-6)}
              </p>
            )}
          </div>

          {/* Security Alert */}
          <Alert className="mb-6 border-blue-200 bg-blue-50/50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Security Tips:</strong> Always verify the merchant name and wallet address before payment. Transactions on the blockchain cannot be reversed.
            </AlertDescription>
          </Alert>

          <Card className="p-6 sm:p-8 space-y-5 sm:space-y-6">
            {/* Wallet Connection */}
            {!walletAddress ? (
              <div className="space-y-3">
                <Label className="text-sm">Connect Wallet</Label>
                <div className="grid gap-3">
                  <Button
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    onClick={() => connectWallet(false)}
                    disabled={isConnecting}
                    variant="outline"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Browser Wallet (MetaMask)
                      </>
                    )}
                  </Button>
                  <Button
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    onClick={() => connectWallet(true)}
                    disabled={isConnecting}
                    variant="outline"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        WalletConnect (Mobile)
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Connect your Celo wallet to make secure blockchain payments
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium text-foreground">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setWalletAddress(null)}
                  >
                    Disconnect
                  </Button>
                </div>

                <div>
                  <Label htmlFor="customerName" className="text-sm">Your Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-2 h-11"
                    maxLength={100}
                  />
                </div>

            {products.length > 0 ? (
              <div>
                <Label className="text-sm">Select Product/Service</Label>
                <div className="grid gap-2 sm:gap-3 mt-2">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className={`p-4 cursor-pointer transition-all touch-manipulation ${
                        selectedProduct === product.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50 active:scale-[0.98]"
                      }`}
                      onClick={() => {
                        setSelectedProduct(product.id);
                        setQuantity(1);
                      }}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products available</p>
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-3">
                <Label className="text-sm">Quantity</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-foreground">{quantity}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(1000, quantity + 1))}
                    disabled={quantity >= 1000}
                    className="h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium text-foreground">
                      ${products.find(p => p.id === selectedProduct)?.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium text-foreground">{quantity}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${((products.find(p => p.id === selectedProduct)?.price || 0) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

                <Button
                  className="w-full h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Pay with Celo
                    </>
                  )}
                </Button>
              </>
            )}
          </Card>

          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground px-2">
            <p>Powered by Celo blockchain • Instant settlement • Low fees</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerPayment;