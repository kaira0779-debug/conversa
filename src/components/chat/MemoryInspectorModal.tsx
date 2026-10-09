import React, { useState } from 'react';
import { Brain, Sparkles, Trash2, X, RefreshCw, BookmarkCheck } from 'lucide-react';

interface MemoryInspectorModalProps {
  characterName: string;
  episodicSummary?: string;
  semanticMemories: string[];
  relationsCount: number;
  recentMessagesCount: number;
  onUpdateSummary: (newSummary: string) => void;
  onDeleteSemanticMemory: (index: number) => void;
  onAddSemanticFact: (fact: string) => void;
  onWipeAllMemories: () => void;
  onClose: () => void;
}

export const MemoryInspectorModal: React.FC<MemoryInspectorModalProps> = ({
  characterName,
  episodicSummary = '',
  semanticMemories,
  relationsCount,
  recentMessagesCount,
  onUpdateSummary,
  onDeleteSemanticMemory,
  onAddSemanticFact,
  onWipeAllMemories,
  onClose,
}) => {
  const [newFact, setNewFact] = useState('');
  const [editingSummary, setEditingSummary] = useState(episodicSummary);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    onAddSemanticFact(newFact.trim());
    setNewFact('');
  };

  const handleSaveSummary = () => {
    onUpdateSummary(editingSummary);
    setIsEditingSummary(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0A1A]/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#1A1430] border border-[#2A2145] p-5 shadow-2xl relative text-[#EDE7F0] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2145]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2A2145] text-[#E8825A]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-cinematic text-lg font-bold">Núcleo de Memoria Persistente</h3>
              <p className="text-[10px] text-[#EDE7F0]/60">Arquitectura de memoria en 4 capas para {characterName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#EDE7F0]/60 hover:text-[#EDE7F0]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[#EDE7F0]/50 block text-[10px]">Corto Plazo:</span>
              <span className="font-semibold text-[#EDE7F0]">{recentMessagesCount} mensajes en contexto</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#2A2145]/40 border border-[#3D2E4A]/40">
              <span className="text-[#EDE7F0]/50 block text-[10px]">Memoria Relacional:</span>
              <span className="font-semibold text-[#EDE7F0]">{relationsCount} vínculos de entidad</span>
            </div>
          </div>

          {/* Layer 2: Episodic Summary */}
          <div className="p-3.5 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#F5A87E] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Capa 2: Memoria Episódica (Resumen de Trama)
              </span>
              <button
                onClick={() => setIsEditingSummary(!isEditingSummary)}
                className="text-[10px] text-[#E8825A] hover:underline"
              >
                {isEditingSummary ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {isEditingSummary ? (
              <div className="space-y-2">
                <textarea
                  value={editingSummary}
                  onChange={(e) => setEditingSummary(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded-xl glass-input text-xs"
                />
                <button
                  onClick={handleSaveSummary}
                  className="px-3 py-1 bg-[#E8825A] text-[#0D0A1A] font-bold text-xs rounded-lg"
                >
                  Guardar Resumen
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#EDE7F0]/80 italic leading-relaxed">
                {episodicSummary || 'No hay resumen episódico aún. Se sintetiza automáticamente cada varios turnos.'}
              </p>
            )}
          </div>

          {/* Layer 3: Semantic Facts */}
          <div className="p-3.5 rounded-2xl bg-[#2A2145]/30 border border-[#3D2E4A]/40">
            <span className="text-xs font-semibold text-[#F5A87E] flex items-center gap-1.5 mb-2">
              <BookmarkCheck className="w-3.5 h-3.5" />
              Capa 3: Memoria Semántica (Hechos y Secretos)
            </span>

            {semanticMemories.length === 0 ? (
              <p className="text-xs text-[#EDE7F0]/50 italic">
                Sin hechos específicos aún. Los secretos, juramentos y lugares mencionados se guardan aquí.
              </p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {semanticMemories.map((fact, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#1A1430] border border-[#2A2145] text-xs text-[#EDE7F0]/85"
                  >
                    <span className="truncate flex-1">✦ {fact}</span>
                    <button
                      onClick={() => onDeleteSemanticMemory(idx)}
                      className="text-[#EDE7F0]/40 hover:text-rose-400 p-1 shrink-0"
                      title="Olvidar hecho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom fact */}
            <form onSubmit={handleAddFact} className="flex gap-2 mt-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="Añadir hecho manual para que nunca lo olvide..."
                className="flex-1 px-3 py-1.5 rounded-xl glass-input text-xs"
              />
              <button
                type="submit"
                disabled={!newFact.trim()}
                className="px-3 py-1.5 bg-[#2A2145] hover:bg-[#3D2E4A] disabled:opacity-40 text-xs font-medium text-[#EDE7F0] rounded-xl transition"
              >
                Añadir
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#2A2145] flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('¿Deseas reiniciar todas las memorias episódicas y semánticas de este chat?')) {
                onWipeAllMemories();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-500/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resetear Memorias</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2A2145] text-xs font-medium text-[#EDE7F0] hover:bg-[#3D2E4A] transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
