import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, BookOpen, Sparkles, Check, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalBooks: number;
}

export function UserProfileDialog({ open, onOpenChange, totalBooks }: UserProfileDialogProps) {
  const [name, setName] = useState(() => {
    return localStorage.getItem("lumen_user_name") || "Reader";
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lumen_user_name", name.trim());
    toast.success("Profile updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#faf8f5] text-stone-900 border-stone-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 flex items-center justify-center font-serif text-2xl font-medium shadow-md border-2 border-amber-900/40 mx-auto select-none">
            {name.trim().charAt(0).toUpperCase() || "R"}
          </div>
          <div>
            <DialogTitle className="font-serif text-lg text-stone-900">
              Personal Reading Profile
            </DialogTitle>
            <p className="text-xs font-sans text-stone-500 mt-1">Quiet Offline Library</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-sans font-medium text-stone-600">Display Name</label>
            <Input
              id="input-user-profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-white border-stone-300 text-xs h-9 rounded-lg"
            />
          </div>

          <div className="bg-stone-100/80 rounded-xl p-3 border border-stone-200/70 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-700">
              <span className="font-sans">Library Books</span>
              <span className="font-mono font-semibold">{totalBooks} volumes</span>
            </div>
            <div className="flex items-center justify-between text-stone-700">
              <span className="font-sans">Storage</span>
              <span className="font-mono text-emerald-700 font-medium">Local IndexedDB</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#24201c] hover:bg-stone-800 text-[#faf8f5] text-xs px-4"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
