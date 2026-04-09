import { useToast } from '@/contexts/ToastContext';

/**
 * Hook auxiliar para exibir mensagens de erro com melhor formatação
 */
export function useErrorHandler() {
  const { showToast } = useToast();

  const handleError = (error: any, defaultMessage: string = 'Une erreur est survenue') => {
    if (typeof error === 'string') {
      showToast(error, 'error');
      return;
    }

    let errorMessage = error?.message || defaultMessage;

    // Extrair mensagem mais específica
    if (errorMessage.includes('rate limit')) {
      showToast('Trop de tentatives. Veuillez attendre quelques minutes', 'warning');
    } else if (errorMessage.includes('email rate limit')) {
      showToast('Limite de emails dépassée. Réessayez dans quelques minutes', 'warning');
    } else if (error?.status === 400 && error?.message === 'User already registered') {
      showToast('Cet email est déjà utilisé', 'error');
    } else if (errorMessage.includes('User already registered')) {
      showToast('Cet email est déjà utilisé', 'error');
    } else if (errorMessage.includes('Invalid login credentials')) {
      showToast('Email ou mot de passe incorrect', 'error');
    } else if (errorMessage.includes('Email not confirmed')) {
      showToast('Veuillez confirmer votre email', 'warning');
    } else if (errorMessage.includes('invalid email')) {
      showToast('Email invalide', 'error');
    } else if (errorMessage.includes('password')) {
      showToast('Mot de passe invalide ou trop faible', 'error');
    } else if (errorMessage.includes('Network') || errorMessage.includes('FETCH')) {
      showToast('Vérifiez votre connexion internet', 'warning');
    } else if (errorMessage.includes('Compte créé')) {
      showToast(errorMessage, 'warning');
    } else if (errorMessage.includes('Pas de session')) {
      showToast('Erreur de session, veuillez réessayer', 'error');
    } else if (errorMessage.includes('connexion automatique')) {
      showToast('Compte créé! Veuillez vous connecter', 'success', 3000);
    } else {
      showToast(errorMessage, 'error');
    }
  };

  return { handleError, showToast };
}
