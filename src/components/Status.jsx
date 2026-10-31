// Маленькие общие компоненты состояний: загрузка, ошибка, пусто.

export function Loader({ text }) {
  return (
    <div className="status-box text-body-secondary" role="status">
      <div className="spinner-border text-primary mb-2" aria-hidden="true" />
      <div>{text}</div>
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="status-box text-body-secondary">{children}</div>;
}
