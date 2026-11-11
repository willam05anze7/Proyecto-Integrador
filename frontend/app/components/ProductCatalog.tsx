"use client";

import { useState } from "react";
import type { Product, Vehicle } from "./catalog-data";

type StockFilter = "all" | "available" | "low";
type ProductSort = "relevance" | "price-asc" | "price-desc" | "name";

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

type ProductCatalogProps = {
  title: string;
  description: string;
  products: Product[];
  selectedVehicle: Vehicle | null;
  onAdd: (product: Product) => void;
  onChooseVehicle: () => void;
  requireVehicle?: boolean;
};

export function ProductCatalog({ title, description, products, selectedVehicle, onAdd, onChooseVehicle, requireVehicle = true }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<ProductSort>("relevance");
  if (!selectedVehicle && requireVehicle) {
    return (
      <section className="gc-empty-state">
        <span className="gc-empty-icon">◈</span>
        <span className="gc-kicker">COMPATIBILIDAD PRECISA</span>
        <h2>Selecciona tu automóvil</h2>
        <p>Para mostrarte repuestos compatibles, primero elige un vehículo del catálogo.</p>
        <button className="gc-gold-button" type="button" onClick={onChooseVehicle}>VER AUTOMÓVILES <span>→</span></button>
      </section>
    );
  }

  if (selectedVehicle?.isFleetVehicle) {
    return (
      <section className="gc-empty-state">
        <span className="gc-empty-icon">◈</span>
        <span className="gc-kicker">VEHÍCULO SELECCIONADO</span>
        <h2>Compatibilidad pendiente</h2>
        <p>La base de datos de productos todavía no está conectada al modelo de este vehículo. No mostraremos repuestos como compatibles hasta contar con esa relación.</p>
        <button className="gc-gold-button" type="button" onClick={onChooseVehicle}>VOLVER AL CATÁLOGO <span>→</span></button>
      </section>
    );
  }

  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.brand.toUpperCase()} ${selectedVehicle.model.toUpperCase()}`
    : "VARIOS MODELOS";
  const visibleProducts = (() => {
    const terms = normalizeSearch(searchQuery).split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        const searchable = normalizeSearch(`${product.name} ${product.brand} ${product.code} ${product.category}`);
        const matchesText = terms.every((term) => searchable.includes(term));
        const matchesStock = stockFilter === "all"
          || (stockFilter === "available" && product.available > 0)
          || (stockFilter === "low" && product.available > 0 && product.available < 6);
        return matchesText && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name, "es");
        return 0;
      });
  })();

  return (
    <div className="gc-content-stack">
      <div className="gc-section-intro">
        <div><span className="gc-kicker">SELECCIÓN COMPATIBLE CON {vehicleLabel}</span><h2>{title}</h2><p>{description}</p></div>
        {selectedVehicle && <button className="gc-vehicle-chip" type="button" onClick={onChooseVehicle}>◈ {selectedVehicle.brand} {selectedVehicle.model} <span>⌄</span></button>}
      </div>
      <section className="gc-product-tools" aria-label="Buscar y filtrar productos">
        <div className="gc-product-search">
          <span className="gc-product-search-icon" aria-hidden="true">⌕</span>
          <input type="search" aria-label="Buscar productos por nombre, marca o código" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar por producto, marca o código..." />
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Limpiar búsqueda">×</button>}
        </div>
        <label className="gc-product-select"><span>Disponibilidad</span>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
            <option value="all">Todo el inventario</option><option value="available">Disponibles</option><option value="low">Pocas unidades</option>
          </select>
        </label>
        <label className="gc-product-select"><span>Ordenar por</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ProductSort)}>
            <option value="relevance">Relevancia</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="name">Nombre</option>
          </select>
        </label>
        <p className="gc-product-count" aria-live="polite">{visibleProducts.length} {visibleProducts.length === 1 ? "producto" : "productos"}</p>
      </section>
      {products.length === 0 ? <p className="gc-empty-copy">No hay productos disponibles en esta categoría.</p> : visibleProducts.length === 0 ? (
        <section className="gc-product-no-results"><span className="gc-kicker">SIN RESULTADOS</span><h3>No encontramos ese producto</h3><p>Prueba con otro nombre, marca o código, o ajusta los filtros.</p><button type="button" onClick={() => { setSearchQuery(""); setStockFilter("all"); }}>Limpiar búsqueda y filtros</button></section>
      ) : (
        <div className="gc-product-grid">
          {visibleProducts.map((product) => (
            <article className="gc-product-card" key={product.id}>
              <div className="gc-product-photo" style={{ backgroundImage: `linear-gradient(0deg,rgba(14,15,14,.15),transparent 55%),url("${product.image}")` }}>
                <span className={`gc-stock${product.available < 6 ? " is-low" : ""}`}><i />{product.available > 0 ? `${product.available} disponibles` : "Agotado"}</span>
              </div>
              <div className="gc-product-info">
                <div className="gc-product-topline"><span>{product.brand}</span><span>{product.code}</span></div>
                <h3>{product.name}</h3>
                <p className="gc-compatibility">✓ {selectedVehicle ? `Compatible con ${selectedVehicle.brand} ${selectedVehicle.model}` : "Compatible con varios modelos"}</p>
                <div className="gc-product-bottom"><strong>Bs. {product.price.toLocaleString("es-BO")}</strong><button type="button" disabled={product.available === 0} onClick={() => onAdd(product)} aria-label={`Agregar ${product.name} a la reserva`}>+</button></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
