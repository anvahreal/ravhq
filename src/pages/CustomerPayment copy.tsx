import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ShoppingCart, Wallet, Shield } from "lucide-react";
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

const paymentSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(100),
  quantity: z.number().int().positive().max(1000),
  merchantId: z.string().uuid("Invalid merchant ID"),
});

const CustomerPayment = () => {
  const { merchantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [merchantName, setMerchantName] = useState("");
  const [merchantWalletAddress, setMerchantWalletAddress] = useState("");
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
      if (!merchantId || !isValidUUID(merchantId)) {
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
        .select("merchant_name, wallet_address")
        .eq("id", merchantId)
        .maybeSingle();

      if (profileError || !profileData?.wallet_address) {
        toast({
          title: "Merchant not found",
          description: "Unable to load merchant information",
          variant: "destructive",
        });
        setLoadingData(false);
        return;
      }

      setMerchantName(profileData.merchant_name || "Merchant");
      setMerchantWalletAddress(profileData.wallet_address);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, description, price")
        .eq("merchant_id", merchantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setProducts(productsData || []);
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
        const wcProvider = await EthereumProvider.init({
          projectId: "6f033f2737797ddd7f1907ba4c264474",
          chains: [11142220],
          showQrModal: true,
          rpcMap: { 11142220: "https://forno.celo-sepolia.celo-testnet.org" },
        });
        await wcProvider.enable();
        provider = new ethers.BrowserProvider(wcProvider);
        accounts = await wcProvider.request({ method: "eth_accounts" });
        setWalletProvider(wcProvider);
      } else {
        if (typeof window.ethereum === "undefined") {
          toast({
            title: "No wallet found",
            description: "Try WalletConnect for mobile wallets",
            variant: "destructive",
          });
          setIsConnecting(false);
          return;
        }
        provider = new ethers.BrowserProvider(window.ethereum);
        accounts = await provider.send("eth_requestAccounts", []);
        
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0xA9F548" }]);
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await provider.send("wallet_addEthereumChain", [{
              chainId: "0xA9F548",
              chainName: "Celo Sepolia Testnet",
              nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
              rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
              blockExplorerUrls: ["https://celo-sepolia.blockscout.com"],
            }]);
          }
        }
        setWalletProvider(window.ethereum);
      }

      setWalletAddress(accounts[0]);
      toast({
        title: "Wallet connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
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
    if (!selectedProduct || !walletAddress) {
      toast({
        title: "Missing information",
        description: "Please select a product and connect wallet",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    try {
      paymentSchema.parse({ customerName, quantity, merchantId });
      setLoading(true);

      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      const amountInWei = ethers.parseUnits((product.price * quantity).toString(), 18);

      const tx = await signer.sendTransaction({
        to: merchantWalletAddress,
        value: amountInWei,
      });

      await tx.wait();

      await supabase.from("transactions").insert([{
        merchant_id: merchantId,
        product_id: product.id,
        customer_name: customerName,
        customer_wallet: walletAddress,
        amount: product.price * quantity,
        quantity,
        tx_hash: tx.hash,
      }]);

      navigate("/success");
    } catch (error) {
      toast({
        title: "Payment failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">Pay {merchantName}</h1>
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Shield className="h-3 w-3" />
              Secured by Celo Sepolia Testnet
            </Badge>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Select Product
            </h2>
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedProduct === product.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <p className="text-xl font-bold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedProduct && (
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Your Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      ${((products.find(p => p.id === selectedProduct)?.price || 0) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            {!walletAddress ? (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => connectWallet(false)} disabled={isConnecting}>
                  <Wallet className="mr-2 h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => connectWallet(true)} disabled={isConnecting}>
                  WalletConnect (Mobile)
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handlePayment} disabled={loading || !selectedProduct}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                {loading ? "Processing..." : "Pay Now"}
              </Button>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerPayment;