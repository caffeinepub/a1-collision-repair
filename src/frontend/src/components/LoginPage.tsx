import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { actor } = useActor();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const ok = await actor.verifyPassword(password);
      if (ok) {
        localStorage.setItem(
          "a1_session",
          JSON.stringify({ authenticated: true }),
        );
        onLogin();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">A1 Collision</h1>
          <p className="text-xl font-semibold text-blue-400">Repair</p>
          <p className="text-slate-400 text-sm mt-1">Fort Walton Beach, FL</p>
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Team Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="shop-password"
                  className="text-slate-300 text-sm font-medium block mb-1"
                >
                  Shop Password
                </label>
                <Input
                  id="shop-password"
                  data-ocid="login.password.input"
                  type="password"
                  placeholder="Enter shop password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-red-400 text-sm"
                >
                  {error}
                </p>
              )}
              <Button
                data-ocid="login.submit_button"
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || !actor}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-slate-500 text-xs mt-4">
          A1 Collision Repair — Shop Management System
        </p>
      </div>
    </div>
  );
}
