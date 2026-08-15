"use client";

import { useState } from "react";
import { Button, Card, Modal } from "@vonveria-swim/ui";
import { apiFetch } from "../../../../lib/api-client";
import { CATEGORY_LABELS, formatCurrency, type ProductCategory, type ProductItem } from "../types";

const CATEGORIES: ProductCategory[] = ["EQUIPMENT", "CONSUMABLE"];

export function InventoryManager({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [creating, setCreating] = useState(false);
  const [movementFor, setMovementFor] = useState<ProductItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("EQUIPMENT");
  const [unitPrice, setUnitPrice] = useState("");
  const [initialStock, setInitialStock] = useState("0");

  const [delta, setDelta] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdjustment, setIsAdjustment] = useState(false);

  async function refresh() {
    setProducts(await apiFetch<ProductItem[]>("/inventory/products?includeInactive=true"));
  }

  async function createProduct() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/inventory/products", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          unitPrice,
          initialStock: Number(initialStock) || 0,
        }),
      });
      setCreating(false);
      setName("");
      setUnitPrice("");
      setInitialStock("0");
      await refresh();
    } catch {
      setError("No se pudo crear el producto. Revisa que el nombre no este repetido.");
    } finally {
      setSaving(false);
    }
  }

  async function registerMovement() {
    if (!movementFor) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/inventory/products/${movementFor.id}/movements`, {
        method: "POST",
        body: JSON.stringify({
          delta: Number(delta),
          reason: isAdjustment ? "ADJUSTMENT" : "PURCHASE",
          ...(notes ? { notes } : {}),
        }),
      });
      setMovementFor(null);
      setDelta("");
      setNotes("");
      setIsAdjustment(false);
      await refresh();
    } catch {
      setError(
        isAdjustment
          ? "No se pudo registrar el ajuste. El motivo es obligatorio."
          : "No se pudo registrar la entrada.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: ProductItem) {
    await apiFetch(`/inventory/products/${product.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Inventario</h1>
          <p className="text-sm text-text-secondary">
            Las existencias se calculan desde los movimientos: se corrigen con un ajuste, no
            editando un numero.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>Nuevo producto</Button>
      </div>

      {error && (
        <Card className="border-status-error">
          <p className="text-sm text-status-error">{error}</p>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-text-secondary">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Precio</th>
                <th className="pb-2">Existencias</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-text-secondary">
                    Todavia no hay productos.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-border-subtle">
                    <td className="py-2 text-text-primary">{product.name}</td>
                    <td className="py-2 text-text-secondary">
                      {CATEGORY_LABELS[product.category]}
                    </td>
                    <td className="py-2 text-text-primary">
                      {formatCurrency(product.unitPrice, product.currency)}
                    </td>
                    <td
                      className={
                        product.stockOnHand <= 0
                          ? "py-2 font-medium text-status-error"
                          : "py-2 text-text-primary"
                      }
                    >
                      {product.stockOnHand}
                    </td>
                    <td className="py-2 text-text-secondary">
                      {product.isActive ? "Activo" : "Dado de baja"}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setMovementFor(product)}
                          className="rounded-md border border-border-subtle px-2 py-1 text-xs text-text-primary hover:bg-bg-base"
                        >
                          Movimiento
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleActive(product)}
                          className="rounded-md border border-border-subtle px-2 py-1 text-xs text-text-primary hover:bg-bg-base"
                        >
                          {product.isActive ? "Dar de baja" : "Reactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo producto"
        footer={
          <div className="flex gap-2">
            <Button onClick={() => void createProduct()} disabled={saving || !name || !unitPrice}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-border-subtle px-3 py-2"
              placeholder="Gorro de natacion"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tipo
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ProductCategory)}
              className="rounded-md border border-border-subtle px-3 py-2"
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Precio de venta
            <input
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              inputMode="decimal"
              className="rounded-md border border-border-subtle px-3 py-2"
              placeholder="120.00"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Existencia inicial
            <input
              value={initialStock}
              onChange={(event) => setInitialStock(event.target.value)}
              inputMode="numeric"
              className="rounded-md border border-border-subtle px-3 py-2"
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={movementFor !== null}
        onClose={() => setMovementFor(null)}
        title={movementFor ? `Movimiento de ${movementFor.name}` : "Movimiento"}
        footer={
          <div className="flex gap-2">
            <Button
              onClick={() => void registerMovement()}
              disabled={saving || !delta || Number(delta) === 0 || (isAdjustment && !notes)}
            >
              {saving ? "Guardando..." : "Registrar"}
            </Button>
            <Button variant="ghost" onClick={() => setMovementFor(null)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            Existencia actual: {movementFor?.stockOnHand ?? 0}
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAdjustment}
              onChange={(event) => setIsAdjustment(event.target.checked)}
            />
            Es un ajuste (merma, robo, conteo mal capturado)
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cantidad {isAdjustment ? "(negativa para descontar)" : "que entra"}
            <input
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
              inputMode="numeric"
              className="rounded-md border border-border-subtle px-3 py-2"
              placeholder={isAdjustment ? "-2" : "20"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Motivo {isAdjustment ? "(obligatorio)" : "(opcional)"}
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="rounded-md border border-border-subtle px-3 py-2"
              placeholder={isAdjustment ? "Merma por caducidad" : "Compra a proveedor"}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
