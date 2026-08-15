"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@vonveria-swim/ui";
import { apiFetch, ApiRequestError } from "../../../lib/api-client";
import {
  CATEGORY_LABELS,
  METHOD_LABELS,
  formatCurrency,
  type PaymentMethod,
  type ProductItem,
  type SaleItem,
} from "./types";

const METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

interface CartLine {
  product: ProductItem;
  quantity: number;
}

export function CounterSale({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<SaleItem | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + Number(line.product.unitPrice) * line.quantity, 0),
    [cart],
  );

  function quantityInCart(productId: string): number {
    return cart.find((line) => line.product.id === productId)?.quantity ?? 0;
  }

  function addToCart(product: ProductItem) {
    setError(null);
    setLastSale(null);
    // No dejamos meter al carrito mas de lo que hay: el backend lo rechazaria
    // igual, pero es mejor no ofrecer lo que no se puede cobrar.
    if (quantityInCart(product.id) >= product.stockOnHand) {
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function removeOne(productId: string) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function charge() {
    if (cart.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const sale = await apiFetch<SaleItem>("/inventory/sales", {
        method: "POST",
        body: JSON.stringify({
          lines: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
          method,
        }),
      });
      setLastSale(sale);
      setCart([]);
      const refreshed = await apiFetch<ProductItem[]>("/inventory/products");
      setProducts(refreshed);
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        const body = caught.body as { errorCode?: string; productName?: string };
        setError(
          body.errorCode === "INSUFFICIENT_STOCK"
            ? `No hay existencias suficientes de ${body.productName ?? "un producto"}.`
            : "No se pudo registrar la venta.",
        );
      } else {
        setError("No se pudo registrar la venta.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Tienda</h1>
        <p className="text-sm text-text-secondary">
          Venta de mostrador con pago inmediato. Lo cobrado entra al corte de caja del dia.
        </p>
      </div>

      {lastSale && (
        <Card className="border-status-success">
          <p className="text-sm text-text-primary">
            Venta registrada por <strong>{formatCurrency(lastSale.total)}</strong> en{" "}
            {METHOD_LABELS[lastSale.method].toLowerCase()}.
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-status-error">
          <p className="text-sm text-status-error">{error}</p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">Productos</h2>
          {products.length === 0 ? (
            <Card>
              <p className="text-sm text-text-secondary">
                Todavia no hay productos. Direccion puede darlos de alta en Inventario.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((product) => {
                const disponible = product.stockOnHand - quantityInCart(product.id);
                const agotado = disponible <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={agotado}
                    title={agotado ? "Sin existencias" : "Agregar al carrito"}
                    className="flex min-h-24 flex-col items-start gap-1 rounded-lg border border-border-subtle p-3 text-left transition-colors hover:bg-bg-base disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-text-primary">{product.name}</span>
                    <span className="text-xs text-text-secondary">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                    <span className="mt-auto text-sm font-semibold text-brand-deep">
                      {formatCurrency(product.unitPrice, product.currency)}
                    </span>
                    <span
                      className={
                        agotado ? "text-xs text-status-error" : "text-xs text-text-secondary"
                      }
                    >
                      {agotado ? "Sin existencias" : `Quedan ${disponible}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">Venta</h2>
          <Card>
            {cart.length === 0 ? (
              <p className="text-sm text-text-secondary">Toca un producto para agregarlo.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cart.map((line) => (
                  <li key={line.product.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-primary">{line.product.name}</p>
                      <p className="text-xs text-text-secondary">
                        {line.quantity} ×{" "}
                        {formatCurrency(line.product.unitPrice, line.product.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(Number(line.product.unitPrice) * line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOne(line.product.id)}
                        aria-label={`Quitar uno de ${line.product.name}`}
                        className="rounded-md border border-border-subtle px-2 py-1 text-xs text-text-primary hover:bg-bg-base"
                      >
                        −
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
              <span className="text-sm text-text-secondary">Total</span>
              <span className="text-lg font-semibold text-text-primary">
                {formatCurrency(total)}
              </span>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs text-text-secondary">Metodo de pago</legend>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMethod(option)}
                    aria-pressed={method === option}
                    className={
                      method === option
                        ? "rounded-md bg-brand-deep px-3 py-2 text-sm text-text-inverse"
                        : "rounded-md border border-border-subtle px-3 py-2 text-sm text-text-primary hover:bg-bg-base"
                    }
                  >
                    {METHOD_LABELS[option]}
                  </button>
                ))}
              </div>
            </fieldset>

            <Button
              className="mt-4 w-full py-3"
              onClick={() => void charge()}
              disabled={cart.length === 0 || saving}
            >
              {saving ? "Cobrando..." : `Cobrar ${formatCurrency(total)}`}
            </Button>
          </Card>
        </section>
      </div>
    </div>
  );
}
