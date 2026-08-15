"use client";

import { useState, type FormEvent } from "react";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import type { BranchItem } from "./types";

export function FacilitiesManager({ initial }: { initial: BranchItem[] }) {
  const [branches, setBranches] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const data = await apiFetch<BranchItem[]>("/facilities/branches");
    setBranches(data);
  }

  async function handleCreateBranch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setError(null);
    try {
      await apiFetch("/facilities/branches", { method: "POST", body: JSON.stringify({ name }) });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo crear la sucursal.");
    }
  }

  async function handleCreatePool(
    branchId: string,
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setError(null);
    try {
      await apiFetch(`/facilities/branches/${branchId}/pools`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo crear la alberca.");
    }
  }

  async function handleCreateLane(
    poolId: string,
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "");
    setError(null);
    try {
      await apiFetch(`/facilities/pools/${poolId}/lanes`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      form.reset();
      await refresh();
    } catch {
      setError("No se pudo crear el carril.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-md">
        <h1 className="mb-3 text-lg font-semibold text-text-primary">Nueva sucursal</h1>
        <form onSubmit={handleCreateBranch} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="Nombre de la sucursal"
            className="flex-1 rounded-md border border-border-subtle px-3 py-2 text-sm"
          />
          <Button type="submit">Agregar</Button>
        </form>
      </Card>

      {error ? <p className="text-sm text-status-error">{error}</p> : null}

      <div className="flex flex-col gap-4">
        {branches.map((branch) => (
          <Card key={branch.id} className="max-w-2xl">
            <h2 className="mb-2 font-semibold text-text-primary">{branch.name}</h2>
            <form
              onSubmit={(event) => void handleCreatePool(branch.id, event)}
              className="mb-3 flex gap-2"
            >
              <input
                name="name"
                required
                placeholder="Nueva alberca"
                className="flex-1 rounded-md border border-border-subtle px-3 py-1.5 text-sm"
              />
              <Button type="submit" variant="ghost">
                Agregar
              </Button>
            </form>

            <div className="flex flex-col gap-3 pl-4">
              {branch.pools.map((pool) => (
                <div key={pool.id}>
                  <h3 className="text-sm font-medium text-text-primary">{pool.name}</h3>
                  <p className="text-xs text-text-secondary">
                    Carriles: {pool.lanes.map((lane) => lane.name).join(", ") || "ninguno"}
                  </p>
                  <form
                    onSubmit={(event) => void handleCreateLane(pool.id, event)}
                    className="mt-1 flex gap-2"
                  >
                    <input
                      name="name"
                      required
                      placeholder="Nuevo carril"
                      className="flex-1 rounded-md border border-border-subtle px-2 py-1 text-xs"
                    />
                    <Button type="submit" variant="ghost">
                      +
                    </Button>
                  </form>
                </div>
              ))}
              {branch.pools.length === 0 ? (
                <p className="text-xs text-text-secondary">Sin albercas todavia.</p>
              ) : null}
            </div>
          </Card>
        ))}
        {branches.length === 0 ? (
          <p className="text-sm text-text-secondary">Sin sucursales todavia.</p>
        ) : null}
      </div>
    </div>
  );
}
