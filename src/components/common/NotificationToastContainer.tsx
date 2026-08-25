import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  ArrowRight,
  Clock,
  Sparkles,
  Package
} from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const { toasts, dismissToast, setActiveTab, markAlertaLido } = usePNAE();

  return (
    <div 
      id="notification-toast-container" 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const isDanger = toast.tipo === 'perigo';
          const isAlert = toast.tipo === 'alerta';
          const isSuccess = toast.tipo === 'sucesso';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all ${
                isDanger
                  ? 'bg-red-50/95 border-red-200 text-red-950 shadow-red-900/10'
                  : isAlert
                  ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-900/10'
                  : isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-900/10'
                  : 'bg-stone-900/95 border-stone-800 text-white shadow-black/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Ícone contextual */}
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isDanger
                      ? 'bg-red-100 text-red-700'
                      : isAlert
                      ? 'bg-amber-100 text-amber-700'
                      : isSuccess
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-stone-800 text-emerald-400'
                  }`}
                >
                  {toast.categoria === 'entrega_af' ? (
                    <Truck className="w-5 h-5" />
                  ) : toast.categoria === 'validade_estoque' || toast.categoria === 'estoque_baixo' ? (
                    <Package className="w-5 h-5" />
                  ) : isDanger ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isAlert ? (
                    <Clock className="w-5 h-5" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold tracking-tight line-clamp-1">
                        {toast.titulo}
                      </span>
                      {toast.categoria === 'entrega_af' && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-semibold px-1.5 py-0.5 rounded">
                          Agri Familiar
                        </span>
                      )}
                      {toast.categoria === 'validade_estoque' && (
                        <span className="text-[10px] bg-red-200/80 text-red-900 font-semibold px-1.5 py-0.5 rounded">
                          Validade Despensa
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-black/5 transition"
                      aria-label="Fechar notificação"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs mt-1 leading-relaxed opacity-90 line-clamp-3">
                    {toast.mensagem}
                  </p>

                  {/* Ação rápida interativa */}
                  {toast.acaoTexto && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          markAlertaLido(toast.id);
                          dismissToast(toast.id);
                          if (toast.acaoTab) {
                            setActiveTab(toast.acaoTab);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition ${
                          isDanger
                            ? 'bg-red-700 hover:bg-red-800 text-white'
                            : isAlert
                            ? 'bg-amber-700 hover:bg-amber-800 text-white'
                            : isSuccess
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold'
                        }`}
                      >
                        <span>{toast.acaoTexto}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
