"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../lib/api-client";
import type { FamilySearchResult } from "./types";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FamilySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiFetch<FamilySearchResult[]>(
        `/families/search?q=${encodeURIComponent(query)}`,
      );
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-text-primary">Alumnos</h1>
        <Link href="/alumnos/nueva-familia">
          <Button>Nueva familia</Button>
        </Link>
      </div>

      <Card className="max-w-xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, telefono o correo"
            className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
      </Card>

      {searched && !loading && results.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Sin resultados. Puedes crear una nueva familia.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {results.map((family) => (
          <Link key={family.id} href={`/alumnos/familias/${family.id}`}>
            <Card className="max-w-2xl transition hover:border-brand-turquoise">
              <p className="font-medium text-text-primary">
                {family.guardians.map((guardian) => guardian.fullName).join(", ") ||
                  "Familia sin tutor"}
              </p>
              <p className="text-sm text-text-secondary">
                Alumnos:{" "}
                {family.students.map((student) => student.fullName).join(", ") || "ninguno"}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
