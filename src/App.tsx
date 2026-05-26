import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Admin } from "@/pages/Admin";
import { Pedidos } from "@/pages/Pedidos";
import { CheckoutSuccess } from "@/pages/CheckoutSuccess";
import { CheckoutFailure } from "@/pages/CheckoutFailure";
import { CheckoutPending } from "@/pages/CheckoutPending";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/pedidos" component={Pedidos} />
      <Route path="/admin">
        {() => <ProtectedRoute component={Admin} />}
      </Route>
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/failure" component={CheckoutFailure} />
      <Route path="/checkout/pending" component={CheckoutPending} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <OrdersProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <style dangerouslySetInnerHTML={{__html: `
                  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
                `}} />
                {/*
                  WouterRouter com base dinâmico para funcionar tanto em
                  desenvolvimento (/) quanto em subpaths (ex: /app/)
                */}
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </QueryClientProvider>
          </AuthProvider>
        </OrdersProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}

export default App;
