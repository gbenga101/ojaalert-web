import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import Commodities from "./pages/Commodities";
import CommodityDetail from "./pages/CommodityDetail";
import VendorDashboard from "./pages/VendorDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/markets" component={Markets} />
      <Route path="/commodities" component={Commodities} />
      <Route path="/commodities/:id" component={CommodityDetail} />
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* Navbar renders once — appears on every page */}
          <Navbar />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;