import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Model } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Layers, Settings2, Trash2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ModelsPage() {
  const { models, sections, addModel } = useMockState();
  const [search, setSearch] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [viewRouteModel, setViewRouteModel] = useState<Model | null>(null);
  const [editModel, setEditModel] = useState<Model | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<any>("rings");
  const [karat, setKarat] = useState("18");
  const [weight, setWeight] = useState("5");
  const [notes, setNotes] = useState("");
  const [stages, setStages] = useState<{sectionId: string, approxLossPercent: number}[]>([]);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<any>("rings");
  const [editKarat, setEditKarat] = useState("18");
  const [editWeight, setEditWeight] = useState("5");
  const [editNotes, setEditNotes] = useState("");
  const [editStages, setEditStages] = useState<{sectionId: string, approxLossPercent: number}[]>([]);

  const filtered = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!name) return;
    addModel({
      name,
      category,
      karat: Number(karat),
      approxWeightGrams: Number(weight),
      stages: stages.map((s, i) => ({ ...s, order: i + 1 })),
      notes
    });
    setIsNewOpen(false);
    setName(""); setStages([]); setNotes("");
    toast({ title: t("models.saveModel"), description: `${name} added successfully.` });
  };

  const openEdit = (model: Model) => {
    setEditModel(model);
    setEditName(model.name);
    setEditCategory(model.category);
    setEditKarat(String(model.karat));
    setEditWeight(String(model.approxWeightGrams));
    setEditNotes(model.notes);
    setEditStages(model.stages.map(s => ({ sectionId: s.sectionId, approxLossPercent: s.approxLossPercent })));
  };

  const handleEditSave = () => {
    toast({ title: t("models.modelUpdated"), description: editName });
    setEditModel(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("models.title")}</h1>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> {t("models.newModel")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("models.createModel")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("models.modelName")}</Label>
                  <Input value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("models.category")}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rings">{t("models.rings")}</SelectItem>
                      <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                      <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                      <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                      <SelectItem value="chains">{t("models.chains")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("models.karat")}</Label>
                  <Select value={karat} onValueChange={setKarat}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
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
                  <Input type="number" value={weight} onChange={e=>setWeight(e.target.value)} />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">{t("models.productionRouting")}</Label>
                  <Button variant="outline" size="sm" onClick={() => setStages([...stages, { sectionId: sections[0]?.id || "", approxLossPercent: 0 }])}>
                    <Plus className="w-4 h-4 me-1" /> {t("models.addStage")}
                  </Button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, idx) => (
                    <div key={idx} className="flex items-end gap-3 bg-muted/50 p-3 rounded-md border">
                      <div className="w-8 shrink-0 pb-2 font-mono font-bold text-muted-foreground">{idx+1}.</div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">{t("models.section")}</Label>
                        <Select value={stage.sectionId} onValueChange={v => { const newS = [...stages]; newS[idx].sectionId = v; setStages(newS); }}>
                          <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                          <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">{t("models.expLoss")}</Label>
                        <Input type="number" step="0.1" className="h-9" value={stage.approxLossPercent}
                          onChange={e => { const newS = [...stages]; newS[idx].approxLossPercent = Number(e.target.value); setStages(newS); }} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setStages(stages.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {stages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("models.noStages")}</p>}
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleSave} disabled={!name || stages.length === 0}>{t("models.saveModel")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("models.searchModels")} className="ps-9 h-12" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(model => (
          <Card key={model.id} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="uppercase text-[10px] tracking-wider bg-primary/5">{t(`models.${model.category}`) || model.category}</Badge>
                <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0 shadow-sm">{model.karat}K</Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{model.name}</CardTitle>
              <p className="font-mono text-xs text-muted-foreground mt-1">{model.code}</p>
            </CardHeader>
            <CardContent className="py-4 flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t("models.weight")}</p>
                  <p className="font-semibold font-mono flex items-center"><Layers className="w-3 h-3 me-1 text-muted-foreground"/> ~{model.approxWeightGrams}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t("models.stages")}</p>
                  <p className="font-semibold flex items-center"><Settings2 className="w-3 h-3 me-1 text-muted-foreground"/> {model.stages.length} {t("models.steps")}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-4 px-4 gap-2">
              <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => setViewRouteModel(model)}>
                {t("models.viewRoute")}
              </Button>
              <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => openEdit(model)}>
                {t("models.edit")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* View Route Sheet */}
      <Sheet open={!!viewRouteModel} onOpenChange={o => !o && setViewRouteModel(null)}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          {viewRouteModel && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <span>{t("models.routeTitle")}</span>
                  <Badge className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 font-bold border-0">{viewRouteModel.karat}K</Badge>
                </SheetTitle>
                <div>
                  <p className="font-bold text-lg">{viewRouteModel.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{viewRouteModel.code}</p>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("models.category")}</p>
                    <p className="font-semibold capitalize">{viewRouteModel.category}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{t("models.approxWeight")}</p>
                    <p className="font-semibold">~{viewRouteModel.approxWeightGrams}g</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3">{t("models.productionRouting")}</p>
                  <div className="space-y-2">
                    {viewRouteModel.stages
                      .slice()
                      .sort((a, b) => a.order - b.order)
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
                </div>

                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Flow</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {viewRouteModel.stages
                      .slice().sort((a,b)=>a.order-b.order)
                      .map((stage, i, arr) => {
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
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Model Sheet */}
      <Sheet open={!!editModel} onOpenChange={o => !o && setEditModel(null)}>
        <SheetContent className="sm:max-w-[520px] overflow-y-auto">
          {editModel && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>{t("models.editModel")}</SheetTitle>
                <p className="font-mono text-xs text-muted-foreground">{editModel.code}</p>
              </SheetHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("models.modelName")}</Label>
                    <Input value={editName} onChange={e=>setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.category")}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rings">{t("models.rings")}</SelectItem>
                        <SelectItem value="pendants">{t("models.pendants")}</SelectItem>
                        <SelectItem value="bracelets">{t("models.bracelets")}</SelectItem>
                        <SelectItem value="earrings">{t("models.earrings")}</SelectItem>
                        <SelectItem value="chains">{t("models.chains")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("models.karat")}</Label>
                    <Select value={editKarat} onValueChange={setEditKarat}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
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
                    <Input type="number" value={editWeight} onChange={e=>setEditWeight(e.target.value)} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">{t("models.productionRouting")}</Label>
                    <Button variant="outline" size="sm" onClick={() => setEditStages([...editStages, { sectionId: sections[0]?.id || "", approxLossPercent: 0 }])}>
                      <Plus className="w-4 h-4 me-1" /> {t("models.addStage")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {editStages.map((stage, idx) => (
                      <div key={idx} className="flex items-end gap-3 bg-muted/50 p-3 rounded-md border">
                        <div className="w-8 shrink-0 pb-2 font-mono font-bold text-muted-foreground">{idx+1}.</div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">{t("models.section")}</Label>
                          <Select value={stage.sectionId} onValueChange={v => { const s=[...editStages]; s[idx].sectionId=v; setEditStages(s); }}>
                            <SelectTrigger className="h-9"><SelectValue/></SelectTrigger>
                            <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">{t("models.expLoss")}</Label>
                          <Input type="number" step="0.1" className="h-9" value={stage.approxLossPercent}
                            onChange={e => { const s=[...editStages]; s[idx].approxLossPercent=Number(e.target.value); setEditStages(s); }} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setEditStages(editStages.filter((_,i)=>i!==idx))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handleEditSave}>{t("models.saveModel")}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
