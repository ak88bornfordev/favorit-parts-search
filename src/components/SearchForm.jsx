export default function SearchForm({ value, minLength, loading, onChange, onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <label htmlFor="article" className="form-label fw-semibold">Артикул детали</label>
      <div className="input-group input-group-lg">
        <input
          id="article"
          type="search"
          className="form-control"
          placeholder="Например, OC90"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="btn btn-primary px-4" type="submit" disabled={value.trim().length < minLength}>
          {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : 'Найти'}
        </button>
      </div>
      <div className="form-text">
        Поиск запускается сам, когда вы перестаете печатать (от {minLength} символов). Enter - искать сразу.
      </div>
    </form>
  );
}
