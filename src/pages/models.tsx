// ============================================================
// صفحة الموديلات — إدارة موديلات المنتجات ومراحل إنتاجها
// ============================================================
import React, { useState, useRef } from "react";
import { useMockState } from "@/lib/mock-state";
import { Model, ModelPart, ProductionStage } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Layers, Settings2, Trash2, ArrowRight, Upload, Gem, ImageIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const CATEGORY_IMAGES: Record<string, string> = {
  rings:     "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=450&fit=crop&q=80",
  pendants:  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=450&fit=crop&q=80",
  bracelets: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=450&fit=crop&q=80",
  earrings:  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=450&fit=crop&q=80",
  chains:    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=450&fit=crop&q=80",
  other:     "https://images.unsplash.com/photo-1629796736279-9f1c0c9acf27?w=600&h=450&fit=crop&q=80",
};

type PartDraft = {
  name: string;
  imageUrl?: string;
  stages: { sectionId: string; approxLossPercent: number }[];
};

function ImageUploadBox({
  imageUrl,
  onImageChange,
  label,
  compact,
}: {
  imageUrl?: string;
  onImageChange: (url: string | undefined) => void;
  label: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onImageChange(URL.createObjectURL(f));
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div
        className={`relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 transition-colors ${compact ? "h-24" : "h-36"}`}
        onClick={() => ref.current?.click()}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-medium">Change</span>
            </div>
            <button
              type="button"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => { e.stopPropagation(); onImageChange(undefined); }}
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className={compact ? "w-5 h-5" : "w-8 h-8"} />
            <span className="text-xs">{compact ? "Upload" : "Click to upload image"}</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function RouteStages({
  stages,
  onChange,
  sections,
}: {
  stages: { sectionId: string; approxLossPercent: number }[];
  onChange: (s: { sectionId: string; approxLossPercent: number }[]) => void;
  sections: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => (
        <div key={idx} className="flex items-end gap-2 bg-muted/40 p-2.5 rounded-md border">
          <div className="w-6 shrink-0 pb-1 font-mono font-bold text-muted-foreground text-xs">{idx + 1}.</div>
          <div className="flex-1 space-y-1 min-w-0">
            <Label className="text-[10px] text-muted-foreground">{t("models.section")}</Label>
            <Select value={stage.sectionId} onValueChange={v => { const s = [...stages]; s[idx].sectionId = v; onChange(s); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-20 space-y-1 shrink-0">
            <Label className="text-[10px] text-muted-foreground">{t("models.expLoss")}</Label>
            <Input type="number" step="0.1" min="0" className="h-8 text-xs" value={stage.approxLossPercent}
              onChange={e => { const s = [...stages]; s[idx].approxLossPercent = Number(e.target.value); onChange(s); }} />
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
            onClick={() => onChange(stages.filter((_, i) => i !== idx))}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      {stages.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-md border border-dashed">
          {t("models.noStages")}
        </p>
      )}
      <Button type="button" variant="outline" size="sm" className="w-full text-xs h-7"
        onClick={() => onChange([...stages, { sectionId: sections[0]?.id || "", approxLossPercent: 0 }])}>
        <Plus className="w-3 h-3 me-1" /> {t("models.addStage")}
      </Button>
    </div>
  );
}

export default function ModelsPage() {
  const { models, sections, addModel } = useMockState();
  const [search, setSearch] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [viewRouteModel, setViewRouteModel] = useState<Model | null>(null);
  const [editModel, setEditModel] = useState<Model | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // ── Create form state ────────────────────────────────────────────
  const [name, setName] = useState("");
  const [category, setCategory] = useState<any>("rings");
  const [karat, setKarat] = useState("18");
  const [weight, setWeight] = useState("5");
  const [notes, setNotes] = useState("");
  const [modelImageUrl, setModelImageUrl] = useState<string | undefined>();
  const [partsCount, setPartsCount] = useState(1);
  const [parts, setParts] = useState<PartDraft[]>([
    { name: "", imageUrl: undefined, stages: [] },
  ]);

  const syncParts = (count: number) => {
    setPartsCount(count);
    setParts(prev => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", imageUrl: undefined, stages: [] });
      return next.slice(0, count);
    });
  };

  const updatePart = (idx: number, updates: Partial<PartDraft>) => {
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  // ── Edit form state ──────────────────────────────────────────────
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<any>("rings");
  const [editKarat, setEditKarat] = useState("18");
  const [editWeight, setEditWeight] = useState("5");
  const [editNotes, setEditNotes] = useState("");
  const [editModelImageUrl, setEditModelImageUrl] = useState<string | undefined>();
  const [editPartsCount, setEditPartsCount] = useState(1);
  const [editParts, setEditParts] = useState<PartDraft[]>([]);
  const [editStages, setEditStages] = useState<{ sectionId: string; approxLossPercent: number }[]>([]);

  const syncEditParts = (count: number) => {
    setEditPartsCount(count);
    setEditParts(prev => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", imageUrl: undefined, stages: [] });
      return next.slice(0, count);
    });
  };

  const updateEditPart = (idx: number, updates: Partial<PartDraft>) => {
    setEditParts(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.code.toLowerCase().includes(search.toLowerCase())
  );

  const resetCreate = () => {
    setName(""); setCategory("rings"); setKarat("18"); setWeight("5"); setNotes("");
    setModelImageUrl(undefined); setPartsCount(1);
    setParts([{ name: "", imageUrl: undefined, stages: [] }]);
  };

  const handleSave = () => {
    if (!name) return;
    const builtParts: ModelPart[] = parts.map((p, i) => ({
      id: `part-${i}-${Date.now()}`,
      name: p.name || `Part ${i + 1}`,
      image: p.imageUrl,
      stages: p.stages.map((s, si) => ({ ...s, order: si + 1 })),
    }));
    const defaultStages = builtParts.length > 0 ? builtParts[0].stages : [];
    addModel({
      name,
      category,
      karat: Number(karat),
      approxWeightGrams: Number(weight),
      stages: defaultStages,
      notes,
      image: modelImageUrl || CATEGORY_IMAGES[category],
      parts: builtParts.length > 0 ? builtParts : undefined,
    });
    setIsNewOpen(false);
    resetCreate();
    toast({ title: t("models.saveModel"), description: `${name} added successfully.` });
  };

  const openEdit = (model: Model) => {
    setEditModel(model);
    setEditName(model.name);
    setEditCategory(model.category);
    setEditKarat(String(model.karat));
    setEditWeight(String(model.approxWeightGrams));
    setEditNotes(model.notes);
    setEditModelImageUrl(model.image);
    setEditStages(model.stages.map(s => ({ sectionId: s.sectionId, approxLossPercent: s.approxLossPercent })));
    const existingParts = model.parts || [];
    setEditPartsCount(existingParts.length);
    setEditParts(existingParts.map(p => ({
      name: p.name,
      imageUrl: p.image,
      stages: p.stages.map(s => ({ sectionId: s.sectionId, approxLossPercent: s.approxLossPercent })),
    })));
  };

  const handleEditSave = () => {
    toast({ title: t("models.modelUpdated"), description: editName });
    setEditModel(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("models.title")}</h1>
        <Dialog open={isNewOpen} onOpenChange={o => { setIsNewOpen(o); if (!o) resetCreate(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> {t("models.newModel")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("models.createModel")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("models.modelName")}</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classic Gold Ring" />
                </div>
                <div className="space-y-2">
                  <Label>{t("models.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rings">{t("models.rings")}</SelectItem>
                      <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                      <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                      <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                      <SelectItem value="chains">{t("models.chains")}</SelectItem>
                      <SelectItem value="other">{t("models.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("models.karat")}</Label>
                  <Select value={karat} onValueChange={setKarat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18">18K</SelectItem>
                      <SelectItem value="21">21K</SelectItem>
                      <SelectItem value="22">22K</SelectItem>
                      <SelectItem value="24">24K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("models.approxWeight")}</Label>
                  <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("models.partsCount")}</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => syncParts(Math.max(0, partsCount - 1))}>
                      <span className="text-base font-bold">−</span>
                    </Button>
                    <Input
                      type="number" min="0" max="20"
                      className="text-center font-bold text-base"
                      value={partsCount}
                      onChange={e => syncParts(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                    />
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => syncParts(partsCount + 1)}>
                      <span className="text-base font-bold">+</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Model image */}
              <ImageUploadBox
                imageUrl={modelImageUrl}
                onImageChange={setModelImageUrl}
                label={t("models.modelImage")}
              />

              {/* Parts */}
              {partsCount > 0 && (
                <div className="border-t pt-4 space-y-4">
                  <Label className="text-sm font-semibold">{t("models.partsSection")}</Label>
                  {parts.map((part, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <Input
                          placeholder={`${t("models.partName")} ${idx + 1}`}
                          value={part.name}
                          onChange={e => updatePart(idx, { name: e.target.value })}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                      <ImageUploadBox
                        imageUrl={part.imageUrl}
                        onImageChange={url => updatePart(idx, { imageUrl: url })}
                        label={t("models.partImage")}
                        compact
                      />
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                        <RouteStages
                          stages={part.stages}
                          onChange={s => updatePart(idx, { stages: s })}
                          sections={sections}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full mt-2" onClick={handleSave} disabled={!name}>{t("models.saveModel")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Search ── */}
      <div className="relative w-full max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("models.searchModels")} className="ps-9 h-11" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── Model Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(model => {
          const imgSrc = model.image || CATEGORY_IMAGES[model.category] || CATEGORY_IMAGES.other;
          return (
            <Card key={model.id} className="flex flex-col hover:border-primary/50 transition-colors overflow-hidden">
              {/* Image */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted/30">
                <img
                  src={imgSrc}
                  alt={model.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-2 start-2 end-2 flex justify-between items-start">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-black/40 backdrop-blur-sm text-white border-white/30">
                    {t(`models.${model.category}`) || model.category}
                  </Badge>
                  <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0 shadow">
                    {model.karat}K
                  </Badge>
                </div>
                {model.parts && model.parts.length > 0 && (
                  <div className="absolute bottom-2 start-2">
                    <Badge variant="secondary" className="text-[10px] bg-black/50 backdrop-blur-sm text-white border-white/20">
                      {model.parts.length} {t("models.parts")}
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base leading-tight">{model.name}</CardTitle>
                <p className="font-mono text-xs text-muted-foreground">{model.code}</p>
              </CardHeader>

              <CardContent className="py-2 flex-1">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("models.weight")}</p>
                    <p className="font-semibold font-mono flex items-center gap-1">
                      <Layers className="w-3 h-3 text-muted-foreground" />~{model.approxWeightGrams}g
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("models.stages")}</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Settings2 className="w-3 h-3 text-muted-foreground" />{model.stages.length} {t("models.steps")}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-3 px-3 gap-2">
                <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => setViewRouteModel(model)}>
                  {t("models.viewRoute")}
                </Button>
                <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => openEdit(model)}>
                  {t("models.edit")}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* ── View Route Sheet ── */}
      <Sheet open={!!viewRouteModel} onOpenChange={o => !o && setViewRouteModel(null)}>
        <SheetContent className="sm:max-w-[520px] overflow-y-auto p-0">
          {viewRouteModel && (
            <div className="flex flex-col h-full">
              {/* Image header */}
              <div className="relative w-full h-48 overflow-hidden bg-muted/30 shrink-0">
                <img
                  src={viewRouteModel.image || CATEGORY_IMAGES[viewRouteModel.category] || CATEGORY_IMAGES.other}
                  alt={viewRouteModel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-bold text-xl text-white leading-tight">{viewRouteModel.name}</p>
                      <p className="font-mono text-xs text-white/70 mt-0.5">{viewRouteModel.code}</p>
                    </div>
                    <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0 shadow">
                      {viewRouteModel.karat}K
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                <SheetHeader className="p-0">
                  <SheetTitle className="text-sm text-muted-foreground font-normal">{t("models.routeTitle")}</SheetTitle>
                </SheetHeader>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("models.category")}</p>
                    <p className="font-semibold capitalize text-xs">{viewRouteModel.category}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("models.approxWeight")}</p>
                    <p className="font-semibold text-xs">~{viewRouteModel.approxWeightGrams}g</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("models.parts")}</p>
                    <p className="font-semibold text-xs">{viewRouteModel.parts?.length || 0}</p>
                  </div>
                </div>

                {/* Routes — by part or single */}
                {viewRouteModel.parts && viewRouteModel.parts.length > 0 ? (
                  <Tabs defaultValue={viewRouteModel.parts[0].id}>
                    <TabsList className="w-full h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-lg">
                      {viewRouteModel.parts.map((part, i) => (
                        <TabsTrigger key={part.id} value={part.id} className="text-xs rounded-md">
                          {part.name || `Part ${i + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {viewRouteModel.parts.map((part, pi) => (
                      <TabsContent key={part.id} value={part.id} className="mt-3 space-y-3">
                        {part.image && (
                          <div className="w-full h-32 overflow-hidden rounded-lg bg-muted/20">
                            <img src={part.image} alt={part.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="space-y-2">
                          {part.stages
                            .slice()
                            .sort((a, b) => a.order - b.order)
                            .map((stage, idx, arr) => {
                              const section = sections.find(s => s.id === stage.sectionId);
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                      {idx + 1}
                                    </div>
                                    {idx < arr.length - 1 && <div className="w-0.5 h-4 bg-border" />}
                                  </div>
                                  <div className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                    <div>
                                      <p className="font-medium text-sm">{section?.name || stage.sectionId}</p>
                                      <p className="text-xs text-muted-foreground">{section?.code}</p>
                                    </div>
                                    {stage.approxLossPercent > 0 && (
                                      <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500/30">
                                        ~{stage.approxLossPercent}%
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Flow</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {part.stages
                              .slice().sort((a, b) => a.order - b.order)
                              .map((stage, i, arr) => {
                                const section = sections.find(s => s.id === stage.sectionId);
                                return (
                                  <React.Fragment key={i}>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-background rounded border font-medium">{section?.name || "?"}</span>
                                    {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                                  </React.Fragment>
                                );
                              })}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div>
                    <p className="text-sm font-semibold mb-3">{t("models.productionRouting")}</p>
                    <div className="space-y-2">
                      {viewRouteModel.stages
                        .slice().sort((a, b) => a.order - b.order)
                        .map((stage, idx, arr) => {
                          const section = sections.find(s => s.id === stage.sectionId);
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
                                  {idx + 1}
                                </div>
                                {idx < arr.length - 1 && <div className="w-0.5 h-4 bg-border" />}
                              </div>
                              <div className="flex-1 flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                                <div>
                                  <p className="font-medium text-sm">{section?.name || stage.sectionId}</p>
                                  <p className="text-xs text-muted-foreground">{section?.code}</p>
                                </div>
                                {stage.approxLossPercent > 0 && (
                                  <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-500/30">
                                    Loss: ~{stage.approxLossPercent}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Flow</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {viewRouteModel.stages.slice().sort((a, b) => a.order - b.order).map((stage, i, arr) => {
                          const section = sections.find(s => s.id === stage.sectionId);
                          return (
                            <React.Fragment key={i}>
                              <span className="text-[10px] px-2 py-0.5 bg-background rounded border font-medium">{section?.name || "?"}</span>
                              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Edit Model Sheet ── */}
      <Sheet open={!!editModel} onOpenChange={o => !o && setEditModel(null)}>
        <SheetContent className="sm:max-w-[560px] overflow-y-auto">
          {editModel && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{t("models.editModel")}</SheetTitle>
                <p className="font-mono text-xs text-muted-foreground">{editModel.code}</p>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("models.modelName")}</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.category")}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rings">{t("models.rings")}</SelectItem>
                        <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                        <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                        <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                        <SelectItem value="chains">{t("models.chains")}</SelectItem>
                        <SelectItem value="other">{t("models.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.karat")}</Label>
                    <Select value={editKarat} onValueChange={setEditKarat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">18K</SelectItem>
                        <SelectItem value="21">21K</SelectItem>
                        <SelectItem value="22">22K</SelectItem>
                        <SelectItem value="24">24K</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.approxWeight")}</Label>
                    <Input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.partsCount")}</Label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                        onClick={() => syncEditParts(Math.max(0, editPartsCount - 1))}>
                        <span className="text-base font-bold">−</span>
                      </Button>
                      <Input
                        type="number" min="0" max="20"
                        className="text-center font-bold"
                        value={editPartsCount}
                        onChange={e => syncEditParts(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                      />
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0"
                        onClick={() => syncEditParts(editPartsCount + 1)}>
                        <span className="text-base font-bold">+</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <ImageUploadBox
                  imageUrl={editModelImageUrl}
                  onImageChange={setEditModelImageUrl}
                  label={t("models.modelImage")}
                />

                {/* Edit parts */}
                {editPartsCount > 0 && (
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-sm font-semibold">{t("models.partsSection")}</Label>
                    {editParts.map((part, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-3 bg-muted/10">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <Input
                            placeholder={`${t("models.partName")} ${idx + 1}`}
                            value={part.name}
                            onChange={e => updateEditPart(idx, { name: e.target.value })}
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                        <ImageUploadBox
                          imageUrl={part.imageUrl}
                          onImageChange={url => updateEditPart(idx, { imageUrl: url })}
                          label={t("models.partImage")}
                          compact
                        />
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("models.partRoute")}</Label>
                          <RouteStages
                            stages={part.stages}
                            onChange={s => updateEditPart(idx, { stages: s })}
                            sections={sections}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback: single route if no parts */}
                {editPartsCount === 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">{t("models.productionRouting")}</Label>
                    </div>
                    <RouteStages stages={editStages} onChange={setEditStages} sections={sections} />
                  </div>
                )}

                <Button className="w-full" onClick={handleEditSave}>{t("models.saveModel")}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
