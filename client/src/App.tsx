import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Ubicell from "./pages/Ubicell";
import DataExplorer from "./pages/DataExplorer";
import DataTables from "./pages/DataTables";
import Analytics from "./pages/Analytics";
import InteractiveMap from "./pages/InteractiveMap";
import NetworkGraph from "./pages/NetworkGraph";

function DashboardRoute() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}


function UbicellRoute() {
  return (
    <DashboardLayout>
      <Ubicell />
    </DashboardLayout>
  );
}

function DataExplorerRoute() {
  return (
    <DashboardLayout>
      <DataExplorer />
    </DashboardLayout>
  );
}

function DataTablesRoute() {
  return (
    <DashboardLayout>
      <DataTables />
    </DashboardLayout>
  );
}

function InteractiveMapRoute() {
  return (
    <DashboardLayout>
      <InteractiveMap />
    </DashboardLayout>
  );
}

function AnalyticsRoute() {
  return (
    <DashboardLayout>
      <Analytics />
    </DashboardLayout>
  );
}

function NetworkGraphRoute() {
  return (
    <DashboardLayout>
      <NetworkGraph />
    </DashboardLayout>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path={"/dashboard"} component={DashboardRoute} />
      <Route path={"/map"} component={InteractiveMapRoute} />
      <Route path={"/ubicell"} component={UbicellRoute} />
      <Route path={"/explorer"} component={DataExplorerRoute} />
      <Route path={"/tables"} component={DataTablesRoute} />
      <Route path={"/analytics"} component={AnalyticsRoute} />
      <Route path={"/network"} component={NetworkGraphRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
