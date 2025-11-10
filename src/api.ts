export type Nutrients = {
    calories?: string | number | null;
    carbohydrateContent?: string | number | null;
    cholesterolContent?: string | number | null;
    fiberContent?: string | number | null;
    proteinContent?: string | number | null;
    saturatedFatContent?: string | number | null;
    sodiumContent?: string | number | null;
    sugarContent?: string | number | null;
    fatContent?: string | number | null;
    [key: string]: any;
};

export type Recipe = {
    id: number;
    cuisine?: string | null;
    title: string;
    rating?: number | null;
    prepTime?: number | null;
    cookTime?: number | null;
    totalTime?: number | null;
    description?: string | null;
    nutrients?: string | Nutrients | null;
    serves?: string | null;
    caloriesInt?: number | null;
};

export type PageResponse<T> = {
    content: T[];
    totalElements: number;
    totalPages?: number;
    number?: number; // zero-based page number
};


export async function fetchRecipesSearch(
    filters: {
        title?: string;
        cuisine?: string;
        rating?: string;
        total_time?: string;
        calories?: string;
    },
    page = 1,
    pageSize = 15
): Promise<PageResponse<Recipe>> {
    const params = new URLSearchParams();
    if (filters.title) params.set("title", filters.title);
    if (filters.cuisine) params.set("cuisine", filters.cuisine);
    if (filters.rating) params.set("rating", filters.rating);
    if (filters.total_time) params.set("total_time", filters.total_time);
    if (filters.calories) params.set("calories", filters.calories);
    params.set("page", String(page));
    params.set("limit", String(pageSize));

    const url = `/api/recipes/search?${params.toString()}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    const text = await res.text();
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (!res.ok) {
        try {
            const parsed = JSON.parse(text);
            throw new Error(`Request failed ${res.status}: ${JSON.stringify(parsed)}`);
        } catch {
            const snippet = text.slice(0, 1000).replace(/\s+/g, " ");
            throw new Error(`Request failed ${res.status}. Response body (truncated): ${snippet}`);
        }
    }

    if (!text || text.trim() === "") {
        return { content: [], totalElements: 0 };
    }

    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(text) as PageResponse<Recipe>;
        } catch (e) {
            throw new Error("Invalid JSON response from server: " + String(e));
        }
    }

    try {
        return JSON.parse(text) as PageResponse<Recipe>;
    } catch {
        const snippet = text.slice(0, 1000).replace(/\s+/g, " ");
        throw new Error(`Expected JSON but got content-type=${contentType}. Body (truncated): ${snippet}`);
    }
}