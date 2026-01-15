"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "@xterm/xterm/css/xterm.css";

interface TerminalTab {
  id: string;
  name: string;
  shell: string;
}

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: "1", name: "Terminal 1", shell: "powershell" },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic import for xterm to avoid SSR issues
    const initTerminal = async () => {
      if (!terminalRef.current) return;

      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Clean up existing terminal
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Cascadia Code", "Fira Code", monospace',
        theme: {
          background: "#1a1a1a",
          foreground: "#d4d4d4",
          cursor: "#d4d4d4",
          cursorAccent: "#1a1a1a",
          selectionBackground: "#3a3a3a",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#ffffff",
        },
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Welcome message
      term.writeln("\x1b[1;34m╔════════════════════════════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[1;34m║\x1b[0m  \x1b[1;36mCluadestrate Terminal\x1b[0m                                      \x1b[1;34m║\x1b[0m");
      term.writeln("\x1b[1;34m║\x1b[0m  \x1b[33mCommand Your AI Fleet\x1b[0m                                       \x1b[1;34m║\x1b[0m");
      term.writeln("\x1b[1;34m╚════════════════════════════════════════════════════════════╝\x1b[0m");
      term.writeln("");
      term.writeln("\x1b[90mNote: Full terminal functionality requires WebSocket connection.\x1b[0m");
      term.writeln("\x1b[90mThis is a preview interface.\x1b[0m");
      term.writeln("");
      term.write("\x1b[32m$ \x1b[0m");

      // Handle input (demo mode)
      let currentLine = "";
      term.onData((data) => {
        if (data === "\r") {
          // Enter pressed
          term.writeln("");
          if (currentLine.trim()) {
            term.writeln(`\x1b[90mCommand: ${currentLine}\x1b[0m`);
            term.writeln("\x1b[33mTerminal commands will be sent via WebSocket when connected.\x1b[0m");
          }
          term.write("\x1b[32m$ \x1b[0m");
          currentLine = "";
        } else if (data === "\x7f") {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data >= " ") {
          // Regular character
          currentLine += data;
          term.write(data);
        }
      });

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
      });
      resizeObserver.observe(terminalRef.current);

      return () => {
        resizeObserver.disconnect();
        term.dispose();
      };
    };

    initTerminal();
  }, [activeTab]);

  const addTab = () => {
    const id = Date.now().toString();
    setTabs([...tabs, { id, name: `Terminal ${tabs.length + 1}`, shell: "powershell" }]);
    setActiveTab(id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[0].id);
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Terminal</h1>
          <p className="text-muted-foreground">
            Interactive command-line interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="powershell">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="powershell">PowerShell</SelectItem>
              <SelectItem value="cmd">Command Prompt</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <Card className={isFullscreen ? "h-[calc(100vh-120px)]" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2"
                  >
                    {tab.name}
                    {tabs.length > 1 && (
                      <X
                        className="w-3 h-3 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm" onClick={addTab}>
              <Plus className="w-4 h-4 mr-1" />
              New Tab
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={terminalRef}
            className={`${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[500px]"} rounded-b-lg overflow-hidden`}
          />
        </CardContent>
      </Card>

      {/* Quick Commands */}
      {!isFullscreen && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                git status
              </Button>
              <Button variant="outline" size="sm">
                git pull
              </Button>
              <Button variant="outline" size="sm">
                git push
              </Button>
              <Button variant="outline" size="sm">
                npm test
              </Button>
              <Button variant="outline" size="sm">
                npm run build
              </Button>
              <Button variant="outline" size="sm">
                npm run dev
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
