import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { userMessageFor } from '../../core/http/ApiError';
import { useServices } from '../../app/ServicesContext';

/**
 * Wraps a submission with the shared failure handling: server field errors go
 * to the form, everything else becomes one customer-safe message.
 */
export function useSubmission<T>(
  send: (input: T) => Promise<void>,
  applyFieldErrors: (error: unknown) => boolean,
) {
  const { logger } = useServices();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: send,
    onMutate: () => setFormError(null),
    onError: error => {
      logger.warn('Submission failed', {
        error: error instanceof Error ? error.name : 'unknown',
      });
      if (!applyFieldErrors(error)) setFormError(userMessageFor(error));
    },
  });
  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    formError,
    setFormError,
  };
}
