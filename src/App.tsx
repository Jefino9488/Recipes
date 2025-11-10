import { useEffect, useState } from "react";
import "./App.css";
import { fetchRecipesSearch, type PageResponse, type Recipe } from "./api";

const PAGE_SIZES = [15, 20, 25, 30, 40, 50];

function Stars({ value }: { value?: number | null }) {
    const v = Math.max(0, Math.min(5, value ?? 0));
    const full = Math.floor(v);
    const half = v - full >= 0.5;
    return (
        <div className="stars" aria-label={`Rating ${v}`}>
            {Array.from({ length: 5 }).map((_, i) => {
                if (i < full) return <span key={i} className="star filled">★</span>;
                if (i === full && half) return <span key={i} className="star half">★</span>;
                return <span key={i} className="star">☆</span>;
            })}
        </div>
    );
}

function tryParseNutrients(n: any) {
    if (!n) return null;
    if (typeof n === "string") {
        try {
            return JSON.parse(n);
        } catch {
            return null;
        }
    }
    return n;
}

export default function App() {
    const [filters, setFilters] = useState({
        title: "",
        cuisine: "",
        rating: "",
        total_time: "",
        calories: "",
    });

    const [page, setPage] = useState(1); // 1-based
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [data, setData] = useState<PageResponse<Recipe> | null>(null);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Recipe | null>(null);
    const [error, setError] = useState<string | null>(null);

    // When filters/page/pageSize change -> fetch
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        fetchRecipesSearch(filters, page, pageSize)
            .then((res) => {
                if (!active) return;
                setData(res);
                setLoading(false);
            })
            .catch((e) => {
                if (!active) return;
                setError(String(e));
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [filters, page, pageSize]);

    const total = data?.totalElements ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // helpers for header inputs handling
    const onFilterChange = (key: keyof typeof filters, value: string) => {
        setPage(1);
        setFilters((s) => ({ ...s, [key]: value }));
    };

    // Minimal fallback screens
    const noResults = !loading && data && (data.content.length === 0 || total === 0);
    const noData = !loading && !data;

    return (
        <div className="app">
            <h1>Recipes</h1>

            <div className="controls">
                <div className="page-size">
                    <label>Results per page:&nbsp;
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="recipes">
                    <thead>
                    <tr>
                        <th className="title-col">
                            <div>Title</div>
                            <input
                                placeholder="Filter title"
                                value={filters.title}
                                onChange={(e) => onFilterChange("title", e.target.value)}
                            />
                        </th>
                        <th>
                            <div>Cuisine</div>
                            <input
                                placeholder="Filter cuisine"
                                value={filters.cuisine}
                                onChange={(e) => onFilterChange("cuisine", e.target.value)}
                            />
                        </th>
                        <th>
                            <div>Rating</div>
                            <input
                                placeholder='e.g. ">=4"'
                                value={filters.rating}
                                onChange={(e) => onFilterChange("rating", e.target.value)}
                            />
                        </th>
                        <th>
                            <div>Total Time</div>
                            <input
                                placeholder='e.g. "<=60"'
                                value={filters.total_time}
                                onChange={(e) => onFilterChange("total_time", e.target.value)}
                            />
                        </th>
                        <th>
                            <div>Serves</div>
                            <input
                                placeholder="Filter serves"
                                value={filters.calories /* small reuse of field - keep separate for clarity */ ? "" : ""}
                                onChange={() => { /* noop - keep minimal */ }}
                                style={{ display: "none" }}
                            />
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && (
                        <tr><td colSpan={5} className="center">Loading…</td></tr>
                    )}

                    {!loading && noResults && (
                        <tr><td colSpan={5} className="center">No results found. Try different filters.</td></tr>
                    )}

                    {!loading && noData && (
                        <tr><td colSpan={5} className="center">No data available.</td></tr>
                    )}

                    {!loading && data && data.content.map((r) => (
                        <tr key={r.id} onClick={() => setSelected(r)} className="row">
                            <td className="title-col"><div className="title-cell">{r.title}</div></td>
                            <td>{r.cuisine ?? "-"}</td>
                            <td><Stars value={r.rating ?? 0} /></td>
                            <td>{r.totalTime ?? "-"}</td>
                            <td>{r.serves ?? "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <span> Page {page} of {totalPages} </span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                <span className="totals"> Total: {total} </span>
            </div>

            {/* Drawer */}
            <aside className={`drawer ${selected ? "open" : ""}`}>
                <div className="drawer-header">
                    <div>
                        <h2>{selected?.title ?? ""}</h2>
                        <div className="muted">{selected?.cuisine ?? ""}</div>
                    </div>
                    <button onClick={() => setSelected(null)}>Close</button>
                </div>

                {selected ? (
                    <div className="drawer-body">
                        <section className="kv">
                            <div className="k">Description</div>
                            <div className="v">{selected.description ?? "-"}</div>
                        </section>

                        <section className="kv expandable">
                            <div className="k">Total Time</div>
                            <div className="v">
                                {selected.totalTime ?? "-"}
                                <DetailsTimes recipe={selected} />
                            </div>
                        </section>

                        <section className="nutrition">
                            <h3>Nutrition</h3>
                            <NutritionTable nutrients={tryParseNutrients(selected.nutrients)} caloriesInt={selected.caloriesInt} />
                        </section>
                    </div>
                ) : (
                    <div className="drawer-body center">No selection</div>
                )}
            </aside>

            {/* small error */}
            {error && <div className="error">Error: {error}</div>}
        </div>
    );
}

function DetailsTimes({ recipe }: { recipe: Recipe }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="times">
            <button className="linkish" onClick={() => setOpen((s) => !s)} aria-expanded={open}>
                {open ? "Hide details" : "Show details"}
            </button>
            {open && (
                <div className="subtimes">
                    <div>Cook Time: {recipe.cookTime ?? "-"}</div>
                    <div>Prep Time: {recipe.prepTime ?? "-"}</div>
                </div>
            )}
        </div>
    );
}

function NutritionTable({ nutrients, caloriesInt }: { nutrients: any; caloriesInt?: number | null }) {
    const n = nutrients ?? {};
    // Accept either derived caloriesInt or nutrients.calories
    const calories = caloriesInt ?? (n.calories ?? n.caloriesValue ?? null);

    const rows: [string, any][] = [
        ["Calories", calories],
        ["carbohydrateContent", n.carbohydrateContent],
        ["cholesterolContent", n.cholesterolContent],
        ["fiberContent", n.fiberContent],
        ["proteinContent", n.proteinContent],
        ["saturatedFatContent", n.saturatedFatContent],
        ["sodiumContent", n.sodiumContent],
        ["sugarContent", n.sugarContent],
        ["fatContent", n.fatContent],
    ];

    const hasAny = rows.some(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");

    if (!hasAny) {
        return <div className="muted">No nutrition data</div>;
    }

    return (
        <table className="nutri">
            <tbody>
            {rows.map(([k, v]) => (
                <tr key={k}>
                    <td className="k">{k}</td>
                    <td className="v">{v ?? "-"}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}
