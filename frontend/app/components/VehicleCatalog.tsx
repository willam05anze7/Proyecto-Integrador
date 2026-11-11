"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AuthApiError } from "../services/auth.service";
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
  uploadVehicleImage,
} from "../services/vehicle.service";
import type { FleetVehicle, VehicleInput } from "../models/vehicle";
import type { Vehicle } from "./catalog-data";

type VehicleCatalogProps = {
  selectedVehicleId: string | null;
  onSelect: (vehicle: Vehicle) => void;
  onRemoveSelection: () => void;
  canManage: boolean;
};

const emptyForm = {
  placa: "",
  anio: String(new Date().getFullYear()),
  color: "",
  kilometraje_actual: "0",
  monto_garantia: "0",
  sector_estacionamiento: "",
  estado: "disponible",
  id_modelo: "",
  id_sucursal: "",
  id_categoria: "",
  id_seguro: "",
  imagen_url: "",
};

function toInput(form: typeof emptyForm): VehicleInput {
  return {
    placa: form.placa.trim().toUpperCase(),
    anio: Number(form.anio),
    color: form.color.trim(),
    kilometraje_actual: Number(form.kilometraje_actual),
    monto_garantia: Number(form.monto_garantia),
    sector_estacionamiento: form.sector_estacionamiento.trim(),
    estado: form.estado,
    id_modelo: Number(form.id_modelo),
    id_sucursal: Number(form.id_sucursal),
    id_categoria: Number(form.id_categoria),
    id_seguro: form.id_seguro.trim() ? Number(form.id_seguro) : null,
    imagen_url: form.imagen_url.trim() || null,
  };
}

function formFromVehicle(vehicle: FleetVehicle) {
  return {
    placa: vehicle.placa,
    anio: String(vehicle.anio ?? ""),
    color: vehicle.color ?? "",
    kilometraje_actual: String(vehicle.kilometraje_actual ?? 0),
    monto_garantia: String(vehicle.monto_garantia ?? 0),
    sector_estacionamiento: vehicle.sector_estacionamiento ?? "",
    estado: vehicle.estado ?? "disponible",
    id_modelo: String(vehicle.id_modelo),
    id_sucursal: String(vehicle.id_sucursal),
    id_categoria: String(vehicle.id_categoria),
    id_seguro: vehicle.id_seguro === null ? "" : String(vehicle.id_seguro),
    imagen_url: vehicle.imagen_url ?? "",
  };
}

function vehicleForSelection(vehicle: FleetVehicle): Vehicle {
  return {
    id: vehicle.placa,
    brand: vehicle.marca,
    model: vehicle.modelo,
    year: vehicle.anio ?? 0,
    type: vehicle.categoria,
    fuelType: null,
    image: vehicle.imagen_url ?? "",
    isFleetVehicle: true,
  };
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function VehicleCatalog({
  selectedVehicleId,
  onSelect,
  onRemoveSelection,
  canManage,
}: VehicleCatalogProps) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPlate, setDeletingPlate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const vehicleCategories = Array.from(
    new Set(vehicles.map((vehicle) => vehicle.categoria.trim()).filter(Boolean)),
  ).sort((first, second) => first.localeCompare(second, "es"));
  const normalizedQuery = normalizeSearchText(searchQuery);
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchableText = normalizeSearchText(
      `${vehicle.placa} ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio ?? ""} ${vehicle.categoria} ${vehicle.color ?? ""} ${vehicle.estado ?? ""} ${vehicle.sucursal}`,
    );

    return (
      searchableText.includes(normalizedQuery) &&
      (selectedCategory === null || vehicle.categoria === selectedCategory)
    );
  });

  const loadVehicles = useCallback(async () => {
    setError(null);
    try {
      setVehicles(await getVehicles());
    } catch (loadError: unknown) {
      if (loadError instanceof AuthApiError && loadError.status === 401) {
        setError("Tu sesión expiró. Ingresa nuevamente.");
      } else {
        setError(errorText(loadError));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  function startCreate() {
    setEditingPlate(null);
    setForm(emptyForm);
    setSelectedImage(null);
    setImageInputKey((current) => current + 1);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  function startEdit(vehicle: FleetVehicle) {
    setEditingPlate(vehicle.placa);
    setForm(formFromVehicle(vehicle));
    setSelectedImage(null);
    setImageInputKey((current) => current + 1);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const input = toInput(form);
      let plate = editingPlate;
      if (editingPlate) {
        await updateVehicle(input);
      } else {
        const created = await createVehicle({
          ...input,
          imagen_url: selectedImage ? null : input.imagen_url,
        });
        plate = created.placa;
        setEditingPlate(created.placa);
      }
      if (selectedImage && plate) {
        await uploadVehicleImage(plate, selectedImage);
      }
      setSuccess(editingPlate ? `Se actualizaron los datos de ${editingPlate}.` : `Se registró el vehículo ${input.placa}.`);
      setIsFormOpen(false);
      setForm(emptyForm);
      setSelectedImage(null);
      setImageInputKey((current) => current + 1);
      setEditingPlate(null);
      await loadVehicles();
    } catch (saveError: unknown) {
      setError(errorText(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(vehicle: FleetVehicle) {
    const confirmed = window.confirm(
      `¿Eliminar el vehículo ${vehicle.placa}? Solo se podrá borrar si no tiene reservas, tarifas, mantenimientos, incidentes ni otros registros asociados.`,
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setDeletingPlate(vehicle.placa);
    try {
      await deleteVehicle(vehicle.placa);
      if (selectedVehicleId === vehicle.placa) onRemoveSelection();
      setSuccess(`Se eliminó el vehículo ${vehicle.placa}.`);
      await loadVehicles();
    } catch (deleteError: unknown) {
      setError(errorText(deleteError));
    } finally {
      setDeletingPlate(null);
    }
  }

  return (
    <div className="gc-content-stack">
      <div className="gc-section-intro">
        <div>
          <span className="gc-kicker">INVENTARIO DE FLOTA</span>
          <h2>Catálogo de automóviles</h2>
          <p>Consulta los vehículos registrados y su estado operativo.</p>
        </div>
        <span className="gc-count-badge">
          {filteredVehicles.length === vehicles.length
            ? `${vehicles.length} VEHÍCULOS`
            : `${filteredVehicles.length} DE ${vehicles.length} VEHÍCULOS`}
        </span>
      </div>

      {canManage && (
        <div className="gc-vehicle-actions">
          <p>La placa identifica cada vehículo. Usa los IDs existentes para modelo, categoría, sucursal y seguro.</p>
          <button className="gc-gold-button" type="button" onClick={startCreate}>REGISTRAR VEHÍCULO <span>+</span></button>
        </div>
      )}
      {!canManage && (
        <p className="gc-user-feedback">La administración de vehículos está disponible para el rol Administrador.</p>
      )}

      {error && <p className="gc-user-feedback is-error" role="alert">{error}</p>}
      {success && <p className="gc-user-feedback is-success" role="status">{success}</p>}

      {vehicles.length > 0 && (
        <>
          <div className="gc-vehicle-search">
            <label htmlFor="gc-vehicle-search-input">Buscar vehículo</label>
            <div className="gc-vehicle-search-field">
              <input
                id="gc-vehicle-search-input"
                type="search"
                placeholder="Marca, modelo, placa o año"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
          {vehicleCategories.length > 1 && (
            <div className="gc-vehicle-filters" role="group" aria-label="Filtrar por categoría">
              <span>Tipo</span>
              <div>
                <button
                  type="button"
                  className={selectedCategory === null ? "is-active" : ""}
                  aria-pressed={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </button>
                {vehicleCategories.map((category) => (
                  <button
                    type="button"
                    key={category}
                    className={selectedCategory === category ? "is-active" : ""}
                    aria-pressed={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {canManage && isFormOpen && (
        <section className="gc-panel-card gc-vehicle-form-card">
          <div className="gc-panel-heading">
            <div>
              <span className="gc-kicker">{editingPlate ? "ACTUALIZACIÓN DE INVENTARIO" : "NUEVO REGISTRO"}</span>
              <h3>{editingPlate ? `Editar ${editingPlate}` : "Registrar vehículo"}</h3>
            </div>
            <button className="gc-text-link" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
          </div>
          <form className="gc-user-form gc-vehicle-form" onSubmit={handleSubmit}>
            <label>Placa
              <input required maxLength={20} value={form.placa} readOnly={Boolean(editingPlate)} onChange={(event) => setForm({ ...form, placa: event.target.value })} />
            </label>
            <label>Año
              <input required type="number" min="1900" max="2100" value={form.anio} onChange={(event) => setForm({ ...form, anio: event.target.value })} />
            </label>
            <label>Color
              <input required maxLength={60} value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </label>
            <label>Kilometraje actual
              <input required type="number" min="0" value={form.kilometraje_actual} onChange={(event) => setForm({ ...form, kilometraje_actual: event.target.value })} />
            </label>
            <label>Monto de garantía
              <input required type="number" min="0" step="0.01" value={form.monto_garantia} onChange={(event) => setForm({ ...form, monto_garantia: event.target.value })} />
            </label>
            <label>Sector de estacionamiento
              <input required maxLength={100} value={form.sector_estacionamiento} onChange={(event) => setForm({ ...form, sector_estacionamiento: event.target.value })} />
            </label>
            <label>Estado
              <select value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value })}>
                <option value="disponible">Disponible</option>
                <option value="alquilado">Alquilado</option>
                <option value="en taller">En taller</option>
              </select>
            </label>
            <label>ID del modelo
              <input required type="number" min="1" value={form.id_modelo} onChange={(event) => setForm({ ...form, id_modelo: event.target.value })} />
            </label>
            <label>ID de la sucursal
              <input required type="number" min="1" value={form.id_sucursal} onChange={(event) => setForm({ ...form, id_sucursal: event.target.value })} />
            </label>
            <label>ID de la categoría
              <input required type="number" min="1" value={form.id_categoria} onChange={(event) => setForm({ ...form, id_categoria: event.target.value })} />
            </label>
            <label>ID del seguro <span>(opcional, según el esquema)</span>
              <input type="number" min="1" value={form.id_seguro} onChange={(event) => setForm({ ...form, id_seguro: event.target.value })} />
            </label>
            <label>URL de imagen <span>(opcional, si no cargas un archivo)</span>
              <input type="url" maxLength={2048} value={form.imagen_url} onChange={(event) => setForm({ ...form, imagen_url: event.target.value })} />
            </label>
            <label>Seleccionar foto desde este equipo <span>(JPG, PNG o WebP; máximo 5 MB)</span>
              <input
                key={imageInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const image = event.target.files?.[0] ?? null;
                  if (image && image.size > 5 * 1024 * 1024) {
                    setError("La imagen no puede superar los 5 MB.");
                    event.target.value = "";
                    setSelectedImage(null);
                    return;
                  }
                  if (image && !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
                    setError("Selecciona una imagen JPG, PNG o WebP.");
                    event.target.value = "";
                    setSelectedImage(null);
                    return;
                  }
                  setError(null);
                  setSelectedImage(image);
                }}
              />
            </label>
            {(imagePreview || form.imagen_url) && (
              <div
                className="gc-vehicle-image-preview"
                role="img"
                aria-label={selectedImage ? "Vista previa de la nueva foto seleccionada" : "Foto actual del vehículo"}
                style={{ backgroundImage: `url("${imagePreview ?? form.imagen_url}")` }}
              />
            )}
            <div className="gc-vehicle-form-actions">
              <button className="gc-gold-button" type="submit" disabled={isSaving}>
                {isSaving ? "GUARDANDO..." : editingPlate ? "GUARDAR CAMBIOS" : "REGISTRAR VEHÍCULO"} <span>→</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {isLoading ? (
        <p className="gc-user-feedback" role="status">Cargando vehículos...</p>
      ) : vehicles.length === 0 ? (
        <section className="gc-empty-state">
          <span className="gc-empty-icon">◈</span>
          <span className="gc-kicker">INVENTARIO VACÍO</span>
          <h2>Aún no hay vehículos registrados</h2>
          <p>{canManage ? "Registra el primer vehículo para que aparezca en este catálogo." : "Solicita al administrador que registre vehículos."}</p>
          {canManage && <button className="gc-gold-button" type="button" onClick={startCreate}>REGISTRAR VEHÍCULO <span>+</span></button>}
        </section>
      ) : filteredVehicles.length === 0 ? (
        <div className="gc-vehicle-empty" role="status">
          No encontramos vehículos con esos criterios. Ajusta la búsqueda o selecciona todas las categorías.
          <button type="button" onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="gc-vehicle-grid">
          {filteredVehicles.map((vehicle) => (
            <article
              className={`gc-vehicle-card${selectedVehicleId === vehicle.placa ? " is-selected" : ""}`}
              key={vehicle.placa}
            >
              <div
                className="gc-vehicle-photo"
                style={{
                  backgroundImage: vehicle.imagen_url
                    ? `linear-gradient(0deg,rgba(14,15,14,.82),transparent 58%),url("${vehicle.imagen_url}")`
                    : "linear-gradient(135deg,#343532,#202120)",
                }}
              >
                <span className="gc-vehicle-type">{vehicle.estado ?? "Estado no definido"}</span>
                <span className="gc-vehicle-year">{vehicle.anio ?? "—"}</span>
              </div>
              <div className="gc-vehicle-info">
                <span className="gc-vehicle-brand">{vehicle.marca} · {vehicle.color ?? "Color no definido"}</span>
                <h3>{vehicle.modelo} <small>· {vehicle.placa}</small></h3>
                <p className="gc-vehicle-details">
                  {vehicle.kilometraje_actual?.toLocaleString("es-BO") ?? "—"} km · {vehicle.categoria}
                  <br />{vehicle.sucursal} · Sector {vehicle.sector_estacionamiento ?? "—"}
                </p>
                <div className="gc-vehicle-card-actions">
                  <button type="button" className="gc-outline-button" onClick={() => onSelect(vehicleForSelection(vehicle))}>
                    SELECCIONAR VEHÍCULO <span>→</span>
                  </button>
                  {canManage && (
                    <div className="gc-vehicle-admin-actions">
                      <button type="button" className="gc-vehicle-edit" onClick={() => startEdit(vehicle)}>Editar datos</button>
                      <button
                        type="button"
                        className="gc-vehicle-delete"
                        disabled={deletingPlate === vehicle.placa}
                        onClick={() => void handleDelete(vehicle)}
                      >
                        {deletingPlate === vehicle.placa ? "Eliminando..." : "Eliminar vehículo"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
