import React, { useState, useRef } from 'react';
import type { Pattern } from '../../types/drum';
import { DEMO_PATTERNS, exportPatternAsJSON, importPatternFromJSON } from '../../services/storage';
import { FolderOpen, X, Plus, Download, Upload, Trash2, Play, Sparkles } from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  savedPatterns: Pattern[];
  activePatternId: string;
  onClose: () => void;
  onSelectPattern: (pattern: Pattern) => void;
  onDeletePattern: (id: string) => void;
  onSaveNewPattern: (name: string) => void;
  onImportPattern: (pattern: Pattern) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  savedPatterns,
  activePatternId,
  onClose,
  onSelectPattern,
  onDeletePattern,
  onSaveNewPattern,
  onImportPattern,
}) => {
  const [newBeatName, setNewBeatName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeatName.trim()) return;
    onSaveNewPattern(newBeatName.trim());
    setNewBeatName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const imported = importPatternFromJSON(text);
      if (imported) {
        onImportPattern(imported);
      } else {
        alert('Invalid pattern JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Pattern Library & Storage
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          
          {/* Create New Beat Form */}
          <form onSubmit={handleCreateNew} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter new beat name..."
              value={newBeatName}
              onChange={(e) => setNewBeatName(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Save Beat
            </button>
          </form>

          {/* Built-in Demo Beats Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Beats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_PATTERNS.map((demo) => {
                const isActive = activePatternId === demo.id;
                return (
                  <div
                    key={demo.id}
                    onClick={() => {
                      onSelectPattern(demo);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-zinc-800 border-orange-500 ring-1 ring-orange-500'
                        : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">{demo.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {demo.bpm} BPM • {demo.stepCount} Steps
                      </span>
                    </div>
                    <Play className="w-4 h-4 text-orange-500" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Saved Beats Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Your Saved Beats ({savedPatterns.length})
              </h3>
              
              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Import JSON Beat
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {savedPatterns.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center border border-dashed border-zinc-800 rounded-xl">
                No custom beats saved yet. Save your current beat pattern above!
              </p>
            ) : (
              <div className="space-y-2">
                {savedPatterns.map((pat) => {
                  const isActive = activePatternId === pat.id;
                  return (
                    <div
                      key={pat.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-zinc-800 border-orange-500 ring-1 ring-orange-500'
                          : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          onSelectPattern(pat);
                          onClose();
                        }}
                      >
                        <h4 className="text-xs font-bold text-zinc-100">{pat.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {pat.bpm} BPM • {pat.stepCount} Steps • {new Date(pat.created).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Export JSON */}
                        <button
                          onClick={() => exportPatternAsJSON(pat)}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-700 text-zinc-300"
                          title="Export JSON file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Delete Beat */}
                        <button
                          onClick={() => onDeletePattern(pat.id)}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 text-rose-400"
                          title="Delete beat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
