"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Toggle } from "@/shared/components";
import { CAPACITY_META } from "@/shared/constants/models";

const defaultCaps = () => Object.fromEntries(Object.keys(CAPACITY_META).map((key) => [key, false]));

// How many matches to render in the dropdown at once. modelOptions can run to
// several hundred entries (e.g. openrouter's full catalog) — the list is
// already filtered by the query, but capping the render count keeps a blank
// query from mounting hundreds of rows.
const MAX_VISIBLE_OPTIONS = 50;

export default function AddCustomModelModal({ isOpen, providerAlias, providerDisplayAlias, modelOptions, onSave, onClose }) {
  const [modelId, setModelId] = useState("");
  const [caps, setCaps] = useState(defaultCaps);
  const [testStatus, setTestStatus] = useState(null); // null | "testing" | "ok" | "error"
  const [testError, setTestError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setModelId(""); setCaps(defaultCaps()); setTestStatus(null); setTestError("");
      setShowOptions(false); setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Close the options popup on an outside click
  useEffect(() => {
    if (!showOptions) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowOptions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);

  const hasOptions = modelOptions && modelOptions.length > 0;

  const filteredOptions = useMemo(() => {
    if (!hasOptions) return [];
    const query = modelId.trim().toLowerCase();
    const matches = query
      ? modelOptions.filter((m) => m.id.toLowerCase().includes(query) || m.name?.toLowerCase().includes(query))
      : modelOptions;
    return matches.slice(0, MAX_VISIBLE_OPTIONS);
  }, [hasOptions, modelOptions, modelId]);

  // Strip provider's own alias prefix (e.g. "cc/model" -> "model" for cc provider)
  const stripAlias = (id) => {
    const prefix = `${providerAlias}/`;
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  };

  const selectOption = (id) => {
    setModelId(id);
    setTestStatus(null);
    setTestError("");
    setShowOptions(false);
    setHighlightedIndex(-1);
  };

  const handleTest = async () => {
    const cleanId = stripAlias(modelId.trim());
    if (!cleanId) return;
    setTestStatus("testing");
    setTestError("");
    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: `${providerAlias}/${cleanId}` }),
      });
      const data = await res.json();
      setTestStatus(data.ok ? "ok" : "error");
      setTestError(data.error || "");
    } catch (err) {
      setTestStatus("error");
      setTestError(err.message);
    }
  };

  const handleSave = async () => {
    const cleanId = stripAlias(modelId.trim());
    if (!cleanId || saving) return;
    setSaving(true);
    try {
      await onSave(cleanId, caps);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showOptions || filteredOptions.length === 0) {
      if (e.key === "Enter") handleTest();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? filteredOptions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex].id);
      } else {
        handleTest();
      }
    } else if (e.key === "Escape") {
      setShowOptions(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Model">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Model ID</label>
          <div className="flex gap-2">
            <div className="relative flex-1" ref={containerRef}>
              <input
                type="text"
                value={modelId}
                onChange={(e) => {
                  setModelId(e.target.value);
                  setTestStatus(null);
                  setTestError("");
                  setHighlightedIndex(-1);
                  if (hasOptions) setShowOptions(true);
                }}
                onFocus={() => { if (hasOptions) setShowOptions(true); }}
                onKeyDown={handleKeyDown}
                placeholder={hasOptions ? "Search or type a model id" : "e.g. claude-opus-4-5"}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
                role={hasOptions ? "combobox" : undefined}
                aria-expanded={hasOptions ? showOptions : undefined}
                aria-autocomplete={hasOptions ? "list" : undefined}
                autoFocus
                autoComplete="off"
              />
              {hasOptions && showOptions && filteredOptions.length > 0 && (
                <ul
                  className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg py-1"
                  role="listbox"
                >
                  {filteredOptions.map((m, i) => (
                    <li key={m.id} role="option" aria-selected={i === highlightedIndex}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectOption(m.id); }}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        className={`w-full text-left px-3 py-1.5 text-sm truncate ${
                          i === highlightedIndex ? "bg-primary/10 text-primary" : "text-text-main hover:bg-primary/5"
                        }`}
                        title={m.name || m.id}
                      >
                        {m.id}
                        {m.name && m.name !== m.id && (
                          <span className="ml-1.5 text-xs text-text-muted">{m.name}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              variant="secondary"
              icon="science"
              loading={testStatus === "testing"}
              onClick={handleTest}
              disabled={!modelId.trim() || testStatus === "testing"}
            >
              {testStatus === "testing" ? "Testing..." : "Test"}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Sent to provider as: <code className="font-mono bg-sidebar px-1 rounded">{stripAlias(modelId.trim()) || "model-id"}</code>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Capabilities</label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(CAPACITY_META).map(([key, meta]) => (
              <Toggle
                key={key}
                checked={!!caps[key]}
                onChange={(v) => setCaps((prev) => ({ ...prev, [key]: v }))}
                label={meta.label}
                description={meta.desc}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Test result */}
        {testStatus === "ok" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Model is reachable
          </div>
        )}
        {testStatus === "error" && (
          <div className="flex items-start gap-2 text-sm text-red-500">
            <span className="material-symbols-outlined text-base shrink-0">cancel</span>
            <span>{testError || "Model not reachable"}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={onClose} variant="ghost" fullWidth size="sm">Cancel</Button>
          <Button
            onClick={handleSave}
            fullWidth
            size="sm"
            disabled={!modelId.trim() || saving}
          >
            {saving ? "Adding..." : "Add Model"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

AddCustomModelModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  providerAlias: PropTypes.string.isRequired,
  providerDisplayAlias: PropTypes.string.isRequired,
  modelOptions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
  })),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

AddCustomModelModal.defaultProps = {
  modelOptions: [],
};
