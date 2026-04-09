import { useCallback, useRef } from 'react';

/**
 * Hook para debounce de funções assíncronas
 * Evita múltiplas submissões rápidas
 */
export function useDebouncedAsync<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessing = useRef(false);

  const debouncedCallback = useCallback(
    (async (...args: any[]) => {
      // Se já está processando, não fazer nada
      if (isProcessing.current) {
        return;
      }

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Marcar como em processamento
      isProcessing.current = true;

      try {
        // Executar callback
        const result = await callback(...args);
        return result;
      } finally {
        // Aguardar delay antes de permitir novo processamento
        timeoutRef.current = setTimeout(() => {
          isProcessing.current = false;
        }, delay);
      }
    }) as T,
    [callback, delay]
  );

  return debouncedCallback;
}
