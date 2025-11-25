import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store } from "lucide-react";

const SetupProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [merchantName, setMerchantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkIfAlreadySetup();
  }, []);

  const checkIfAlreadySetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if merchant_name already exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("merchant_name")
      .eq("id", session.user.id)
      .single();

    if (profile?.merchant_name) {
      // Already set up, redirect to dashboard
      navigate("/dashboard");
      return;
    }

    setChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchantName.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ merchant_name: merchantName.trim() })
      .eq("id", session.user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Profile completed!",
      description: "Welcome to RAV Payment System",
    });

    navigate("/dashboard");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us about your business to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="merchantName" className="text-sm font-medium">
              Business Name *
            </Label>
            <Input
              id="merchantName"
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Joe's Coffee Shop"
              className="mt-2"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be shown to customers when they make payments
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !merchantName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SetupProfile;