import React, { createContext, useContext, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Toast, ToastMessage, ToastType } from '@/components/Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = Date.now().toString();
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
          duration,
        },
      ]);
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          pointerEvents: 'box-none',
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast} onHide={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
