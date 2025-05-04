
import { ThemeProvider } from "@/components/ThemeProvider";
import CalendarApp from "@/components/CalendarApp";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <CalendarApp />
      <Toaster />
    </ThemeProvider>
  );
};

export default Index;
