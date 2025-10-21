import { MessageSquare, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const ConversationSidebar = () => {
  const { user, logout } = useAuth();

  const conversations = [
    { id: 1, title: "YouTube Strategy 2024", date: "Today" },
    { id: 2, title: "Content Calendar Planning", date: "Yesterday" },
    { id: 3, title: "SEO Optimization Tips", date: "2 days ago" },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Conversations</h2>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto py-3 px-3"
            >
              <div className="flex items-start gap-2 w-full">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-sidebar-foreground">
                    {conv.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{conv.date}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Profile Section */}
      <div className="border-t bg-sidebar-accent/50">
        <Separator />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex-1 justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
