import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ClearableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  leftIcon?: React.ReactNode;
  textArea?: boolean;
}

export function ClearableInput({
  value,
  onChange,
  onClear,
  leftIcon,
  textArea = false,
  className = "",
  ...props
}: ClearableInputProps) {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <div className={`absolute left-3 ${textArea ? "top-3" : "top-1/2 transform -translate-y-1/2"}`}>
          {leftIcon}
        </div>
      )}
      
      <Input
        className={`${leftIcon ? "pl-10" : ""} ${textArea ? "min-h-[80px]" : ""} pr-10 ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full px-3"
          onClick={onClear}
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Clear input</span>
        </Button>
      )}
    </div>
  );
}