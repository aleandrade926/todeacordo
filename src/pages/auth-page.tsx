import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Keyboard, Target, Trophy, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ email: "", username: "", password: "" });
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Jornada do <span className="text-primary">Mestre das Teclas</span>
            </h1>
            <p className="text-xl text-gray-600">
              Transforme sua digitação em 30 dias com nossa metodologia completa
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Meta 30 PPM</span>
              </div>
              <p className="text-sm text-gray-600">Semana 1: Fileira guia</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Meta 50 PPM</span>
              </div>
              <p className="text-sm text-gray-600">Semana 2: Fluência</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Keyboard className="h-5 w-5 text-primary" />
                <span className="font-semibold">Meta 60 PPM</span>
              </div>
              <p className="text-sm text-gray-600">Semana 3: Resistência</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-semibold">Meta 80+ PPM</span>
              </div>
              <p className="text-sm text-gray-600">Semana 4: Elite</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">O que você vai aprender:</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Posicionamento correto das mãos</li>
              <li>• Técnicas de memorização muscular</li>
              <li>• Exercícios progressivos de velocidade</li>
              <li>• Correção de erros comuns</li>
              <li>• Digitação profissional avançada</li>
            </ul>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Acesse sua conta</CardTitle>
              <CardDescription>
                Entre ou crie uma conta para começar sua jornada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex border-b">
                  <button
                    className={`flex-1 py-2 text-center border-b-2 ${
                      activeTab === "login" 
                        ? "border-primary text-primary font-medium" 
                        : "border-transparent text-gray-500"
                    }`}
                    onClick={() => setActiveTab("login")}
                  >
                    Entrar
                  </button>
                  <button
                    className={`flex-1 py-2 text-center border-b-2 ${
                      activeTab === "register" 
                        ? "border-primary text-primary font-medium" 
                        : "border-transparent text-gray-500"
                    }`}
                    onClick={() => setActiveTab("register")}
                  >
                    Cadastrar
                  </button>
                </div>
                
                {activeTab === "login" && (
                <div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        data-testid="input-login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </div>
                )}
                
                {activeTab === "register" && (
                <div>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Nome de usuário</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Seu nome"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        required
                        data-testid="input-register-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        minLength={6}
                        data-testid="input-register-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
                      ) : (
                        "Criar conta"
                      )}
                    </Button>
                  </form>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}