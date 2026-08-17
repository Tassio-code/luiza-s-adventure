import { useState } from "react";
import {
  ACCESSORIES,
  BOTTOMS,
  BROW_SHAPES,
  CLOTH_COLORS,
  EYE_COLORS,
  EYE_SHAPES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_SHAPES,
  SKIN_TONES,
  TOPS,
  toggleAccessory,
  type AvatarConfig,
} from "@/game/avatar/options";
import { AvatarCanvas } from "./AvatarCanvas";
import { Button } from "@/components/ui/button";
import { audio } from "@/game/audio";

type Tab = "corpo" | "cabelo" | "rosto" | "roupas" | "extras";

const TABS: { id: Tab; label: string }[] = [
  { id: "corpo", label: "Pele" },
  { id: "cabelo", label: "Cabelo" },
  { id: "rosto", label: "Rosto" },
  { id: "roupas", label: "Roupas" },
  { id: "extras", label: "Acessórios" },
];

function Swatches({
  items,
  value,
  onSelect,
  label,
}: {
  items: { id: string; label: string; color: string }[];
  value: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={value === item.id}
            onClick={() => onSelect(item.id)}
            className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
              value === item.id ? "border-primary shadow-glow" : "border-border"
            }`}
            style={{ backgroundColor: item.color }}
          />
        ))}
      </div>
    </div>
  );
}

function Chips({
  items,
  value,
  onSelect,
  label,
}: {
  items: { id: string; label: string }[];
  value: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={value === item.id}
            onClick={() => onSelect(item.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              value === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CharacterCreator({
  value,
  onChange,
  onConfirm,
  onBack,
}: {
  value: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("corpo");
  // Each patch only touches the given category — everything else is preserved.
  const set = <K extends keyof AvatarConfig>(key: K, v: AvatarConfig[K]) => {
    audio.ui();
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-stretch">
      <section className="panel-parchment relative flex flex-1 flex-col items-center justify-center rounded-2xl p-6">
        <h1 className="mb-2 text-center text-2xl text-primary text-glow">Crie sua heroína</h1>
        <p className="mb-4 max-w-sm text-center text-sm text-muted-foreground">
          Este é o personagem que vai atravessar as cinco regiões. Tudo o que você escolher aqui
          continua igual em todas as fases.
        </p>
        <AvatarCanvas config={value} className="h-72 w-56 sm:h-96 sm:w-72" />
        <input
          value={value.name}
          maxLength={18}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Nome da heroína"
          className="mt-4 w-56 rounded-md border border-border bg-input px-3 py-2 text-center text-sm text-foreground outline-none focus:border-primary"
        />
      </section>

      <section className="panel-parchment flex flex-1 flex-col rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {tab === "corpo" && (
            <Swatches items={SKIN_TONES} value={value.skin} onSelect={(id) => set("skin", id)} label="Tom de pele" />
          )}
          {tab === "cabelo" && (
            <>
              <Chips items={HAIR_STYLES} value={value.hair} onSelect={(id) => set("hair", id)} label="Penteado" />
              <Swatches items={HAIR_COLORS} value={value.hairColor} onSelect={(id) => set("hairColor", id)} label="Cor do cabelo" />
            </>
          )}
          {tab === "rosto" && (
            <>
              <Chips items={EYE_SHAPES} value={value.eyes} onSelect={(id) => set("eyes", id)} label="Formato dos olhos" />
              <Swatches items={EYE_COLORS} value={value.eyeColor} onSelect={(id) => set("eyeColor", id)} label="Cor dos olhos" />
              <Chips items={BROW_SHAPES} value={value.brow} onSelect={(id) => set("brow", id)} label="Sobrancelhas" />
              <Chips items={MOUTH_SHAPES} value={value.mouth} onSelect={(id) => set("mouth", id)} label="Boca" />
            </>
          )}
          {tab === "roupas" && (
            <>
              <Chips items={TOPS} value={value.top} onSelect={(id) => set("top", id)} label="Parte de cima" />
              <Swatches items={CLOTH_COLORS} value={value.topColor} onSelect={(id) => set("topColor", id)} label="Cor da blusa" />
              <Chips items={BOTTOMS} value={value.bottom} onSelect={(id) => set("bottom", id)} label="Parte de baixo" />
              <Swatches items={CLOTH_COLORS} value={value.bottomColor} onSelect={(id) => set("bottomColor", id)} label="Cor da calça/saia" />
            </>
          )}
          {tab === "extras" && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Acessórios</p>
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map((item) => {
                  const active = value.accessories.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set("accessories", toggleAccessory(value.accessories, item.id))}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-secondary-foreground hover:border-primary"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" onClick={onBack}>
            Voltar
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            Começar a jornada
          </Button>
        </div>
      </section>
    </div>
  );
}
