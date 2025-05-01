
import React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("py-4 px-6 border-b", className)}>
      <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-md bg-sf-blue flex items-center justify-center mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h2" />
              <path d="M8 17h2" />
              <path d="M14 13h2" />
              <path d="M14 17h2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-sf-navy">Form QA Testing App</h1>
            <p className="text-sm text-muted-foreground">
              Generate test data for form.io schemas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            City of San Francisco
          </div>
          <div className="w-8 h-8 rounded-full bg-sf-navy flex items-center justify-center text-white text-sm font-bold">
            SF
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
