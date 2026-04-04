import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLogin, useRegister, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { data: user, isLoading: checkingAuth } = useUser();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // ✅ FIX: move redirect here
  useEffect(() => {
    if (user && !checkingAuth) {
      setLocation("/");
    }
  }, [user, checkingAuth, setLocation]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = (data) => {
    if (isLogin) {
      loginMutation.mutate({ email: data.email, password: data.password }, {
        onSuccess: () => {
          toast({ title: "Login successful", description: "Welcome back!", variant: "success" });
          setLocation("/dashboard");
        },
        onError: (err) => toast({ title: "Login failed", description: err.message, variant: "destructive" })
      });
    } else {
      if (!data.name) {
        toast({ title: "Validation Error", description: "Name is required for registration", variant: "destructive" });
        return;
      }
      registerMutation.mutate({ name: data.name, email: data.email, password: data.password }, {
        onSuccess: () => {
          toast({ title: "Account created", description: "You're signed in now.", variant: "success" });
          setLocation("/dashboard");
        },
        onError: (err) => toast({ title: "Registration failed", description: err.message, variant: "destructive" })
      });
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side - Marketing/Branding */}
      <div className="hidden md:flex flex-1 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-black/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white text-primary p-3 rounded-2xl shadow-xl">
            <Activity className="h-8 w-8" />
          </div>
          <span className="font-display font-bold text-3xl tracking-tight">HabitTracker</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Build habits that <br/>last a lifetime.
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Track your daily goals, build impressive streaks, and visualize your progress over time with our beautiful analytics.
          </p>
          
          <div className="space-y-4">
            {['Visual Heatmaps', 'Streak Tracking', 'Weekly & Monthly Insights'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 font-medium text-primary-foreground/90">
                <CheckCircle2 className="h-6 w-6 text-white" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-primary">HabitTracker</span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Enter your details to access your habits." : "Sign up to start tracking your habits today."}
            </p>
          </div>

          <Card className="border-border shadow-xl shadow-black/5">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                    <label className="text-sm font-semibold text-foreground">Full Name</label>
                    <Input {...register("name")} placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <Input type="email" {...register("email")} placeholder="name@example.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">Password</label>
                  </div>
                  <Input type="password" {...register("password")} placeholder="••••••••" />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full mt-2 h-12 text-base group" disabled={isPending}>
                  {isPending ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
                  {!isPending && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}