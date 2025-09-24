import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

interface CollapsibleSidebarGroupProps {
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  persistKey?: string; // Key for localStorage persistence
  children: React.ReactNode;
  className?: string;
  itemCount?: number; // Optional count badge when collapsed
}

export function CollapsibleSidebarGroup({
  title,
  icon,
  defaultCollapsed = false,
  persistKey,
  children,
  className,
  itemCount
}: CollapsibleSidebarGroupProps) {
  // State management with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`sidebar_${persistKey}_collapsed`);
      return saved !== null ? JSON.parse(saved) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`sidebar_${persistKey}_collapsed`, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, persistKey]);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarGroup className={cn("px-4 py-2", className)}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel 
            className="text-xs font-semibold tracking-wide text-muted-foreground/60 uppercase mb-3 cursor-pointer group hover:text-muted-foreground/80 transition-colors duration-200 select-none"
            onClick={handleToggle}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {icon}
                <span>{title}</span>
              </div>
              <div className="flex items-center gap-2">
                {isCollapsed && itemCount && (
                  <div className="bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded text-xs font-medium">
                    {itemCount}
                  </div>
                )}
                <div className="transition-transform duration-200 group-hover:scale-110">
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </div>
              </div>
            </div>
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
          <SidebarGroupContent>
            {children}
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

// Export a hook for managing global sidebar collapse state (if needed)
export function useSidebarCollapseState(sections: string[]) {
  const [collapseStates, setCollapseStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const states: Record<string, boolean> = {};
      sections.forEach(section => {
        const saved = localStorage.getItem(`sidebar_${section}_collapsed`);
        states[section] = saved !== null ? JSON.parse(saved) : false;
      });
      setCollapseStates(states);
    }
  }, [sections]);

  const toggleSection = (section: string) => {
    setCollapseStates(prev => {
      const newState = !prev[section];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sidebar_${section}_collapsed`, JSON.stringify(newState));
      }
      return { ...prev, [section]: newState };
    });
  };

  const collapseAll = () => {
    sections.forEach(section => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sidebar_${section}_collapsed`, JSON.stringify(true));
      }
    });
    setCollapseStates(Object.fromEntries(sections.map(s => [s, true])));
  };

  const expandAll = () => {
    sections.forEach(section => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sidebar_${section}_collapsed`, JSON.stringify(false));
      }
    });
    setCollapseStates(Object.fromEntries(sections.map(s => [s, false])));
  };

  return { collapseStates, toggleSection, collapseAll, expandAll };
}