import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  busId: z.string().min(1, 'Bus ID is required'),
  route: z.string().min(1, 'Route is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginData = z.infer<typeof loginSchema>;
type SignupData = z.infer<typeof signupSchema>;

interface DriverAuthProps {
  onLoginSuccess: (driver: any, token: string) => void;
}

export function DriverAuth({ onLoginSuccess }: DriverAuthProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { name: '', password: '' },
  });

  const signupForm = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { 
      name: '', 
      busId: '', 
      route: '', 
      password: '' 
    },
    mode: 'onChange',
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest('POST', '/api/driver/login', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      onLoginSuccess(data.driver, data.token);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest('POST', '/api/driver/register', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "Account created successfully!",
      });
      onLoginSuccess(data.driver, data.token);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Registration failed",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onSignup = (data: SignupData) => {
    console.log('Form data:', data); // Debug log
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30">
      <div className="max-w-md w-full mx-4">
        {isLoginMode ? (
          <Card className="shadow-lg" data-testid="card-driver-login">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bus text-primary-foreground text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Driver Login</h2>
                <p className="text-muted-foreground">Access your driver dashboard</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your name" 
                            {...field}
                            data-testid="input-login-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field}
                            data-testid="input-login-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-sign-in-alt mr-2"></i>
                    )}
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLoginMode(false)}
                  className="text-primary hover:underline text-sm"
                  data-testid="button-show-signup"
                >
                  Don't have an account? Sign up here
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg" data-testid="card-driver-signup">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-plus text-white text-2xl"></i>
                </div>
                <h2 className="text-2xl font-bold">Driver Registration</h2>
                <p className="text-muted-foreground">Create your driver account</p>
              </div>

              <Form {...signupForm}>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mb-4">
                    Form values: {JSON.stringify(signupForm.watch())}
                  </div>
                )}
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-6" noValidate>
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field}
                            data-testid="input-signup-name"
                            autoComplete="name"
                            disabled={signupMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="busId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus ID</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={signupMutation.isPending}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bus-id">
                              <SelectValue placeholder="Select your bus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ait1">AIT1</SelectItem>
                            <SelectItem value="ait2">AIT2</SelectItem>
                            <SelectItem value="ait3">AIT3</SelectItem>
                            <SelectItem value="ait4">AIT4</SelectItem>
                            <SelectItem value="ait5">AIT5</SelectItem>
                            <SelectItem value="ait6">AIT6</SelectItem>
                            <SelectItem value="ait7">AIT7</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="route"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={signupMutation.isPending}>
                          <FormControl>
                            <SelectTrigger data-testid="select-route">
                              <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bus Stand">Bus Stand</SelectItem>
                            <SelectItem value="Vijaipura">Vijaipura</SelectItem>
                            <SelectItem value="Kote">Kote</SelectItem>
                            <SelectItem value="Hostel">Hostel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            {...field}
                            data-testid="input-signup-password"
                            autoComplete="new-password"
                            disabled={signupMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary/90"
                    disabled={signupMutation.isPending}
                    data-testid="button-signup"
                  >
                    {signupMutation.isPending ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-user-check mr-2"></i>
                    )}
                    {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLoginMode(true)}
                  className="text-primary hover:underline text-sm"
                  data-testid="button-show-login"
                >
                  Already have an account? Login here
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
