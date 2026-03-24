"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/locale";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export default function AccountAddressesPage() {
  const t = useTranslations();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/addresses")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAddresses(data))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const startNew = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setStreet("");
    setCity("");
    setStateRegion("");
    setPostalCode("");
    setIsDefault(addresses.length === 0);
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setName(addr.name);
    setPhone(addr.phone);
    // 对旧数据无法精确拆分时，先全部放在街道这一栏，用户可自行调整
    setStreet(addr.address);
    setCity("");
    setStateRegion("");
    setPostalCode("");
    setIsDefault(addr.isDefault);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = [street, city, stateRegion, postalCode].filter(Boolean).join(", ");
    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          name,
          phone,
          address: fullAddress,
          isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error ?? "Failed to save address");
        return;
      }
      setAddresses((prev) => {
        const rest = prev.filter((a) => a.id !== data.id);
        return [...rest, data].sort((a, b) =>
          a.isDefault === b.isDefault
            ? 0
            : a.isDefault
            ? -1
            : 1
        );
      });
      setEditing(null);
      setName("");
      setPhone("");
      setStreet("");
      setCity("");
      setStateRegion("");
      setPostalCode("");
      setIsDefault(false);
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (addr: Address) => {
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: addr.id, isDefault: true }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // eslint-disable-next-line no-alert
      alert((data as { error?: string }).error ?? "Failed to set default");
      return;
    }
    setAddresses((prev) =>
      prev
        .map((a) => ({ ...a, isDefault: a.id === addr.id }))
        .sort((a, b) =>
          a.isDefault === b.isDefault
            ? 0
            : a.isDefault
            ? -1
            : 1
        )
    );
  };

  const remove = async (addr: Address) => {
    if (!window.confirm("Delete this address?")) return;
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(addr.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // eslint-disable-next-line no-alert
      alert((data as { error?: string }).error ?? "Failed to delete");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">{t("accountAddresses.title")}</h1>
      <p className="mt-2 text-zinc-400">{t("accountAddresses.desc")}</p>

      <div className="mt-8 space-y-4">
        {loading && (
          <p className="text-sm text-zinc-500">Loading…</p>
        )}
        {!loading &&
          addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-brand-card p-4"
            >
              <div>
                <p className="font-medium text-white">
                  {addr.name} {addr.phone}
                </p>
                <p className="mt-1 text-sm text-zinc-400">{addr.address}</p>
                {addr.isDefault && (
                  <span className="mt-2 inline-block rounded bg-brand-accent/20 px-2 py-0.5 text-xs text-brand-accent">
                    {t("accountAddresses.default")}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(addr)}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  {t("accountAddresses.edit")}
                </button>
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(addr)}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    {t("accountAddresses.setDefault")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(addr)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4 rounded-xl border border-zinc-800 bg-brand-card p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          {editing ? t("accountAddresses.edit") : t("accountAddresses.addNew")}
        </h2>
        <div>
          <label className="block text-sm text-zinc-400">{t("checkout.name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">{t("checkout.phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">Street address</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-zinc-400">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">State</label>
            <input
              type="text"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">ZIP</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-brand-dark px-4 py-2 text-white"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-zinc-600"
          />
          {t("accountAddresses.setDefault")}
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "..." : t("accountAddresses.addNew")}
          </button>
          {editing && (
            <button
              type="button"
              onClick={startNew}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

