import { Plus, FolderOpen, MessageSquare, Code } from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "new", icon: Plus, label: "New" },
  { id: "projects", icon: FolderOpen, label: "Projects" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "code", icon: Code, label: "Code" },
];

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <div className="w-14 bg-sidebar flex flex-col items-center py-3 border-r border-sidebar-border shrink-0">
      <div className="flex flex-col items-center gap-0.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px]">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto">
        <SettingsDialog />
      </div>
    </div>
  );
}
