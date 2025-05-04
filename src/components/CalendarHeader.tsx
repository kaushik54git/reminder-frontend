import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Settings, 
  Menu,
  PanelLeft,
  LogOut
} from "lucide-react";
import { CalendarView, getCalendarTitle } from "@/lib/calendar-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CalendarHeaderProps = {
  date: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onToday: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  isAiViewActive: boolean;
  onToggleAiView: () => void;
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  date,
  view,
  onViewChange,
  onDateChange,
  onToday,
  onToggleSidebar,
  sidebarVisible,
  isAiViewActive,
  onToggleAiView
}) => {
  const isMobile = useIsMobile();
  const title = getCalendarTitle(date, view);
  const { user, logout } = useAuth();

  const handlePrevious = () => {
    if (view === "day") {
      onDateChange(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
    } else if (view === "week") {
      onDateChange(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7));
    } else {
      onDateChange(new Date(date.getFullYear(), date.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (view === "day") {
      onDateChange(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
    } else if (view === "week") {
      onDateChange(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7));
    } else {
      onDateChange(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    }
  };

  return (
    <header className="bg-background border-b border-border py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold hidden md:block">Calendar</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium hidden sm:inline-block">
            {title}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden md:block">
            <Tabs 
              defaultValue="week" 
              value={view} 
              onValueChange={(v) => onViewChange(v as CalendarView)}
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="hidden md:block">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </div>
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Settings className="h-5 w-5" />
          </Button>

          {/* AI Button */}
          <Button 
            variant={isAiViewActive ? "default" : "ghost"} 
            size="sm" 
            className={`hidden md:inline-flex ${isAiViewActive ? 'bg-green-500 hover:bg-green-600' : ''}`}
            onClick={onToggleAiView}
          >
            AI
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isMobile && (
        <div className="mt-2 flex justify-center">
          <Tabs 
            defaultValue="week" 
            value={view} 
            onValueChange={(v) => onViewChange(v as CalendarView)}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger value="day" className="flex-1">Day</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
              <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </header>
  );
};

export default CalendarHeader;
