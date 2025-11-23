import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorHandler";
import { z } from "zod";

// Validation schema for product inputs
const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  price: z
    .number()
    .positive("Price must be positive")
    .max(1000000, "Price too large")
    .multipleOf(0.01, "Price can have max 2 decimal places"),
});

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

const Products = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage products.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      fetchProducts();
    };
    checkAuthAndFetch();
  }, [navigate, toast]);

  const fetchProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Unable to load products",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Validate inputs
      const validatedData = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
      });

      const productData = {
        merchant_id: session.user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (error) {
          toast({
            title: "Unable to update product",
            description: getErrorMessage(error),
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Product updated successfully" });
      } else {
        // Wrap product data in an array
        const { error } = await supabase
        .from("products")
        .insert([productData]);

        if (error) {
          toast({
            title: "Unable to add product",
            description: getErrorMessage(error),
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Product added successfully" });
      }

      setFormData({ name: "", description: "", price: "" });
      setIsAdding(false);
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Unable to delete product",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Product deleted successfully" });
    fetchProducts();
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (error) {
      toast({
        title: "Unable to update product status",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    fetchProducts();
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                  Products & Services
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage your product catalog
                </p>
              </div>
              <Button onClick={() => setIsAdding(!isAdding)} className="w-full sm:w-auto h-11">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Search Bar */}
            {products.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 sm:h-12"
                />
              </div>
            )}
          </div>

          {isAdding && (
            <Card className="p-5 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    maxLength={200}
                    className="h-11 mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    maxLength={1000}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    className="h-11 mt-1.5"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button type="submit" className="h-11 w-full sm:w-auto">
                    {editingId ? "Update" : "Add"} Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({ name: "", description: "", price: "" });
                    }}
                    className="h-11 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-3 sm:space-y-4">
            {products.length === 0 ? (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                  No products yet. Add your first product to get started.
                </p>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                  No products match your search. Try a different search term.
                </p>
              </Card>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                          {product.name}
                        </h3>
                        <span className="text-xl sm:text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-sm sm:text-base text-muted-foreground mb-3">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(product.id, product.is_active)
                          }
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        className="h-10 w-10 flex-1 sm:flex-none"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="h-10 w-10 flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
