import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon, Check, X } from "lucide-react";

export function PhotoGuidelines() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0 text-xs text-muted-foreground hover:text-primary mx-auto"
          onClick={() => setOpen(true)}
        >
          <InfoIcon className="w-3 h-3 mr-1" />
          Photo guidelines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Photo Guidelines</DialogTitle>
          <DialogDescription>
            Please follow these guidelines when uploading your profile photo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 border p-3 rounded-md border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h3 className="text-sm font-medium flex items-center text-green-700 dark:text-green-400">
                <Check className="w-4 h-4 mr-1" />
                Good Examples
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-primary">Clear face</span>
                  </div>
                  <div className="text-xs">Clear front-facing photo</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-primary">Good light</span>
                  </div>
                  <div className="text-xs">Well-lit environment</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-primary">Neutral</span>
                  </div>
                  <div className="text-xs">Neutral background</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 border p-3 rounded-md border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
              <h3 className="text-sm font-medium flex items-center text-red-700 dark:text-red-400">
                <X className="w-4 h-4 mr-1" />
                Not Allowed
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-red-500">Group</span>
                  </div>
                  <div className="text-xs">Group photos</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-red-500">Logo</span>
                  </div>
                  <div className="text-xs">Logos or icons</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-red-500">Blurry</span>
                  </div>
                  <div className="text-xs">Blurry or low quality</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm space-y-2 pt-2">
            <h3 className="font-medium">Technical Requirements:</h3>
            <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
              <li>Allowed formats: JPG, PNG, GIF, WebP</li>
              <li>Maximum file size: 5MB</li>
              <li>Recommended dimensions: 400x400 pixels or larger</li>
              <li>Square aspect ratio works best</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}