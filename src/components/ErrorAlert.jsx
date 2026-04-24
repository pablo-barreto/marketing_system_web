'use client';
import React from 'react';

/**
 * Componente reutilizable de alerta de error inline.
 * Muestra un mensaje claro con opciones opcionales de reintentar o descartar.
 *
 * Props:
 *   message   - string: el mensaje de error a mostrar
 *   onRetry   - function (opcional): callback para reintentar la acción
 *   onDismiss - function (opcional): callback para descartar el error
 *   className - string (opcional): clases adicionales
 */
const ErrorAlert = ({ message, onRetry, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 ${className}`}
    >
      <svg
        className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed break-words">{message}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold text-red-600 hover:text-red-800 underline transition-colors"
          >
            Reintentar
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
