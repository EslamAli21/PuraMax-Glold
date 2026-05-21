import React, { useState, useRef } from "react";
import { useMockState } from "@/lib/mock-state";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TreePine, ScanLine, Package, Printer, Save, Shuffle, CheckCircle2, Clock, Plus, Trash2, X, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TreeItem {
  code: string;
  model: string;
  karat: string;
  qty: number;
  weight: number;
  status: "placed";
}

interface WaitingItem {
  code: string;
  model: string;
  karat: string;
  qty: number;
  weight: number;
}

interface Tree {
  id: string;
  code: string;
  modelCode: string;
  karat: string;
  holders: number;
  items: TreeItem[];
  notes: string;
}

interface Box {
  code: string;
  primary: boolean;
  weight: number;
  items: string;
  count: number;
}

const INITIAL_WAITING: WaitingItem[] = [
  { code: "EER-4022", model: "Drop Earrings",  karat: "18K", qty: 20, weight: 104.0 },
  { code: "CHN-5023", model: "Rope Chain 18K", karat: "18K", qty: 12, weight: 168.0 },
  { code: "RNG-6044", model: "Signet Ring",    karat: "21K", qty: 15, weight: 67.5 },
  { code: "PEN-7011", model: "Star Pendant",   karat: "18K", qty: 10, weight: 48.0 },
];

function generateBoxes(items: TreeItem[]): Box[] {
  if (items.length === 0) return [];
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const itemsSummary = items.map(i => `${i.code} (${Math.ceil(i.qty / 3)})`).join(", ");
  return [
    { code: "BOX-001", primary: true,  weight: parseFloat((totalWeight * 0.45).toFixed(1)), items: itemsSummary, count: Math.ceil(items.reduce((s,i)=>s+i.qty,0)/3) },
    { code: "BOX-002", primary: false, weight: parseFloat((totalWeight * 0.35).toFixed(1)), items: itemsSummary, count: Math.ceil(items.reduce((s,i)=>s+i.qty,0)/3) },
    { code: "BOX-003", primary: false, weight: parseFloat((totalWeight * 0.20).toFixed(1)), items: itemsSummary, count: Math.floor(items.reduce((s,i)=>s+i.qty,0)/3) },
  ];
}

export default function TreeBuildPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [workerInput, setWorkerInput] = useState("Ahmed Khan (Sales)");
  const [sessionTime] = useState("01:25:36");

  const [trees, setTrees] = useState<Tree[]>([
    {
      id: "tree-001",
      code: "TR-001125",
      modelCode: "TREE-18K-24H",
      karat: "18K",
      holders: 40,
      notes: "",
      items: [
        { code: "RNG-1012", model: "Classic Gold Ring", karat: "18K", qty: 16, weight: 72.0, status: "placed" },
        { code: "PEN-2045", model: "Leaf Pendant",      karat: "18K", qty: 14, weight: 95.2, status: "placed" },
        { code: "BGL-3108", model: "Twist Bangle",      karat: "22K", qty: 8,  weight: 176.0, status: "placed" },
      ]
    }
  ]);
  const [activeTreeId, setActiveTreeId] = useState<string>("tree-001");
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>(INITIAL_WAITING);
  const [isNewTreeOpen, setIsNewTreeOpen] = useState(false);
  const [clearConfirmId, setClearConfirmId] = useState<string | null>(null);
  const [dragOverTree, setDragOverTree] = useState(false);

  // New tree form
  const [newTreeCode, setNewTreeCode] = useState("");
  const [newModelCode, setNewModelCode] = useState("");
  const [newKarat, setNewKarat] = useState("18K");
  const [newHolders, setNewHolders] = useState("40");

  const dragItemRef = useRef<WaitingItem | null>(null);

  const activeTree = trees.find(t => t.id === activeTreeId) || null;

  const totalItems = activeTree ? activeTree.items.reduce((s, i) => s + i.qty, 0) : 0;
  const stoneWeight = activeTree ? activeTree.items.length * 2.983 : 0;
  const grossWeight = activeTree ? activeTree.items.reduce((s, i) => s + i.weight, 0) : 0;
  const netWeight = grossWeight - stoneWeight;
  const boxes = activeTree ? generateBoxes(activeTree.items) : [];

  const handleCreateTree = () => {
    if (!newTreeCode.trim()) return;
    const newTree: Tree = {
      id: `tree-${Date.now()}`,
      code: newTreeCode.trim(),
      modelCode: newModelCode.trim() || "TREE-18K",
      karat: newKarat,
      holders: parseInt(newHolders) || 40,
      items: [],
      notes: ""
    };
    setTrees(prev => [...prev, newTree]);
    setActiveTreeId(newTree.id);
    setIsNewTreeOpen(false);
    setNewTreeCode(""); setNewModelCode(""); setNewKarat("18K"); setNewHolders("40");
    toast({ title: t("treeBuild.treeCreated"), description: `${newTree.code} — ${t("treeBuild.newTreeDesc")}` });
  };

  const handlePlaceItem = (item: WaitingItem) => {
    if (!activeTree) {
      toast({ title: "No tree selected", description: t("treeBuild.noTreeSelected"), variant: "destructive" });
      return;
    }
    const existing = activeTree.items.find(i => i.code === item.code);
    const updatedItem: TreeItem = existing
      ? { ...existing, qty: existing.qty + item.qty, weight: existing.weight + item.weight }
      : { ...item, status: "placed" };

    setTrees(prev => prev.map(tr => tr.id === activeTreeId
      ? { ...tr, items: existing ? tr.items.map(i => i.code === item.code ? updatedItem : i) : [...tr.items, updatedItem] }
      : tr
    ));
    setWaitingItems(prev => prev.filter(w => w.code !== item.code));
    toast({ title: t("treeBuild.itemPlaced"), description: `${item.code} → ${activeTree.code}` });
  };

  const handleRemoveItem = (itemCode: string) => {
    if (!activeTree) return;
    const removedItem = activeTree.items.find(i => i.code === itemCode);
    if (!removedItem) return;
    setTrees(prev => prev.map(tr => tr.id === activeTreeId
      ? { ...tr, items: tr.items.filter(i => i.code !== itemCode) }
      : tr
    ));
    const { status, ...waiting } = removedItem;
    setWaitingItems(prev => [waiting, ...prev]);
    toast({ title: t("treeBuild.itemRemoved"), description: itemCode });
  };

  const handleClearTree = (treeId: string) => {
    const tree = trees.find(t => t.id === treeId);
    if (!tree) return;
    const removedItems = tree.items.map(({ status, ...w }) => w as WaitingItem);
    setTrees(prev => prev.map(tr => tr.id === treeId ? { ...tr, items: [] } : tr));
    setWaitingItems(prev => [...removedItems, ...prev]);
    setClearConfirmId(null);
    toast({ title: t("treeBuild.treeCleared"), description: tree.code });
  };

  const handleSaveTree = () => {
    if (!activeTree) return;
    toast({ title: t("treeBuild.treeSaved"), description: `${activeTree.code} — ${totalItems} items, ${grossWeight.toFixed(1)}g gross.` });
  };

  const handleAutoDistribute = () => {
    toast({ title: t("treeBuild.autoDistribute"), description: "Items redistributed into 3 optimised boxes." });
  };

  const handleUpdateNotes = (notes: string) => {
    setTrees(prev => prev.map(tr => tr.id === activeTreeId ? { ...tr, notes } : tr));
  };

  // Drag & Drop handlers
  const handleDragStart = (item: WaitingItem) => {
    dragItemRef.current = item;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTree(true);
  };

  const handleDragLeave = () => {
    setDragOverTree(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTree(false);
    if (dragItemRef.current) {
      handlePlaceItem(dragItemRef.current);
      dragItemRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("treeBuild.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("treeBuild.subtitle")}</p>
        </div>
        <Dialog open={isNewTreeOpen} onOpenChange={setIsNewTreeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("treeBuild.newTree")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("treeBuild.createNewTree")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t("treeBuild.treeCodeLabel")} *</Label>
                <Input
                  placeholder="TR-001200"
                  value={newTreeCode}
                  onChange={e => setNewTreeCode(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("treeBuild.modelCodeLabel")}</Label>
                <Input
                  placeholder="TREE-18K-24H"
                  value={newModelCode}
                  onChange={e => setNewModelCode(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("treeBuild.karatLabel")}</Label>
                  <Select value={newKarat} onValueChange={setNewKarat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18K">18K</SelectItem>
                      <SelectItem value="21K">21K</SelectItem>
                      <SelectItem value="22K">22K</SelectItem>
                      <SelectItem value="24K">24K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("treeBuild.holdersLabel")}</Label>
                  <Input
                    type="number"
                    value={newHolders}
                    onChange={e => setNewHolders(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateTree}
                disabled={!newTreeCode.trim()}
              >
                <TreePine className="h-4 w-4 me-2" />
                {t("treeBuild.createTree")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tree Tabs */}
      {trees.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {trees.map(tree => (
            <button
              key={tree.id}
              onClick={() => setActiveTreeId(tree.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                tree.id === activeTreeId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <TreePine className="h-3.5 w-3.5" />
              {tree.code}
              {tree.items.length > 0 && (
                <span className={`ml-1 text-[10px] px-1 rounded ${tree.id === activeTreeId ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                  {tree.items.reduce((s,i)=>s+i.qty,0)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scan Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Card className="flex-1 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{t("treeBuild.scanWorkerQr")}</p>
              <Input value={workerInput} onChange={e => setWorkerInput(e.target.value)}
                className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{t("treeBuild.scanItemQr")}</p>
              <Input
                placeholder="Scan or enter item / tree / box QR..."
                className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    const found = waitingItems.find(w => w.code.toLowerCase() === val.toLowerCase());
                    if (found) { handlePlaceItem(found); (e.target as HTMLInputElement).value = ""; }
                    else toast({ title: "Item not found", description: `No waiting item with code: ${val}`, variant: "destructive" });
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t("treeBuild.session")}</p>
              <p className="text-sm font-bold font-mono text-primary">{sessionTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {!activeTree ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <TreePine className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm mb-4">{t("treeBuild.noTreeSelected")}</p>
            <Button onClick={() => setIsNewTreeOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("treeBuild.newTree")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col xl:flex-row gap-4">
          {/* LEFT — Items Waiting + Tree Builder */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Items Waiting */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between">
                <CardTitle className="text-sm">{t("treeBuild.itemsWaiting")} ({waitingItems.length})</CardTitle>
                <Badge variant="outline" className="text-[10px]">Drag & drop onto tree ↓</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {waitingItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">All items placed on trees</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[10px] pl-4 w-8"></TableHead>
                        <TableHead className="text-[10px]">Item Code</TableHead>
                        <TableHead className="text-[10px]">Model</TableHead>
                        <TableHead className="text-[10px]">Karat</TableHead>
                        <TableHead className="text-[10px]">Wt (g)</TableHead>
                        <TableHead className="text-[10px]">Qty</TableHead>
                        <TableHead className="text-[10px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingItems.map(item => (
                        <TableRow
                          key={item.code}
                          className="border-border/50 hover:bg-muted/30 cursor-grab text-xs"
                          draggable
                          onDragStart={() => handleDragStart(item)}
                        >
                          <TableCell className="pl-4">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          </TableCell>
                          <TableCell className="font-mono text-[10px]">{item.code}</TableCell>
                          <TableCell>{item.model}</TableCell>
                          <TableCell>{item.karat}</TableCell>
                          <TableCell>{item.weight}g</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] h-6 px-2 text-primary hover:bg-primary/10"
                              onClick={() => handlePlaceItem(item)}
                            >
                              + Place
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Tree Builder */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <TreePine className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Tree Builder</CardTitle>
                  <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                  <span className="text-xs text-muted-foreground font-mono">{activeTree.code}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setClearConfirmId(activeTree.id)}
                >
                  <Trash2 className="h-3 w-3" /> Clear Tree
                </Button>
              </CardHeader>
              <CardContent>
                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-3 mb-4 transition-all duration-200 ${
                    dragOverTree
                      ? "border-primary bg-primary/10 scale-[1.01]"
                      : "border-border/60 bg-muted/10"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {activeTree.items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                      <TreePine className="h-12 w-12 opacity-30" />
                      <p className="text-xs">{t("treeBuild.dropZone")}</p>
                    </div>
                  ) : (
                    <div className="w-full flex items-start justify-center gap-4">
                      <TreePine className="h-16 w-16 text-green-600 opacity-60 shrink-0 mt-2" />
                      <div className="space-y-1">
                        {activeTree.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                            <span className="font-mono text-[10px]">{item.code}</span>
                            <span className="text-muted-foreground">×{item.qty}</span>
                            <span className="text-primary text-[10px]">{item.weight}g</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {dragOverTree ? "Release to place item on tree" : `Tree Composition (${totalItems}/${activeTree.holders} holders)`}
                  </p>
                </div>

                {/* Items on Tree Table */}
                {activeTree.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[10px]">Item Code</TableHead>
                        <TableHead className="text-[10px]">Model</TableHead>
                        <TableHead className="text-[10px]">Karat</TableHead>
                        <TableHead className="text-[10px]">Qty</TableHead>
                        <TableHead className="text-[10px]">Weight (g)</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTree.items.map(item => (
                        <TableRow key={item.code} className="border-border/50 text-xs">
                          <TableCell className="font-mono text-[10px]">{item.code}</TableCell>
                          <TableCell>{item.model}</TableCell>
                          <TableCell>{item.karat}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell className="text-primary">{item.weight}g</TableCell>
                          <TableCell>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30">Placed</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveItem(item.code)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-border/50 font-medium">
                        <TableCell colSpan={3} className="text-xs">Total Items: {totalItems}</TableCell>
                        <TableCell className="text-xs">{totalItems}</TableCell>
                        <TableCell className="text-xs text-primary font-bold">{grossWeight.toFixed(1)}g</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}

                {/* Route Preview */}
                <div className="mt-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">{t("treeBuild.routePreview")}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {["Designer", "3D Print", "Tree", "Casting", "Finishing", "QC"].map((step, i, arr) => (
                      <React.Fragment key={step}>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${step === "Tree" ? "bg-green-500/20 text-green-400 font-bold" : "bg-muted text-muted-foreground"}`}>{step}</span>
                        {i < arr.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <p className="text-xs font-medium mb-1.5">{t("treeBuild.treeNotes")}</p>
                  <Textarea
                    value={activeTree.notes}
                    onChange={e => handleUpdateNotes(e.target.value)}
                    placeholder={t("treeBuild.addNotes")}
                    className="text-xs min-h-[60px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Boxes */}
            <Card className="border-border/50">
              <CardHeader className="pb-2 pt-4 px-4 flex-row items-center justify-between">
                <CardTitle className="text-sm">{t("treeBuild.generatedBoxes")} ({boxes.length})</CardTitle>
                <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1" onClick={handleAutoDistribute}>
                  <Shuffle className="h-3 w-3" /> {t("treeBuild.autoDistribute")}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {boxes.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No boxes generated yet. Add items to the tree first.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[10px] pl-4">{t("treeBuild.boxCode")}</TableHead>
                        <TableHead className="text-[10px]">{t("treeBuild.totalWeight")}</TableHead>
                        <TableHead className="text-[10px]">{t("treeBuild.items")}</TableHead>
                        <TableHead className="text-[10px]">{t("treeBuild.itemCount")}</TableHead>
                        <TableHead className="text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boxes.map(box => (
                        <TableRow key={box.code} className="border-border/50 text-xs">
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3 w-3 text-primary" />
                              <span className="font-mono font-medium">{box.code}</span>
                              {box.primary && <Badge variant="outline" className="text-[10px] px-1 py-0">Primary</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-primary font-medium">{box.weight}g</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground max-w-[180px] truncate">{box.items}</TableCell>
                          <TableCell>{box.count}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2"
                                onClick={() => toast({ title: "Box Details", description: `${box.code}: ${box.weight}g, ${box.count} items` })}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2"
                                onClick={() => toast({ title: t("treeBuild.printLabel"), description: `Printing label for ${box.code}` })}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT — Tree Summary */}
          <div className="w-full xl:w-72 shrink-0 space-y-3">
            <Card className="border-border/50 sticky top-4">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">{t("treeBuild.treeSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  [t("treeBuild.treeCode"), activeTree.code],
                  ["Model Code", activeTree.modelCode],
                  [t("treeBuild.karat"), activeTree.karat],
                  [t("treeBuild.holdersUsed"), `${totalItems} / ${activeTree.holders}`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between py-1 border-b border-border/30">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("treeBuild.grossTreeWeight")}</span><span className="font-medium">{grossWeight.toFixed(3)}g</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Stone Weight</span><span>{stoneWeight.toFixed(3)}g</span></div>
                  <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-2">
                    <span>{t("treeBuild.netTreeWeight")}</span>
                    <span className="text-primary">{netWeight.toFixed(3)}g</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button className="w-full h-8 text-xs gap-1.5" size="sm" onClick={handleSaveTree}>
                    <Save className="h-3.5 w-3.5" /> {t("treeBuild.saveTree")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-8 text-xs gap-1.5"
                    size="sm"
                    onClick={() => toast({ title: t("treeBuild.printTreeQr"), description: `Printing QR for ${activeTree.code}` })}
                  >
                    <Printer className="h-3.5 w-3.5" /> {t("treeBuild.printTreeQr")}
                  </Button>
                </div>

                {/* All Trees list */}
                {trees.length > 1 && (
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">{t("treeBuild.allTrees")}</p>
                    <div className="space-y-1">
                      {trees.map(tree => (
                        <button
                          key={tree.id}
                          onClick={() => setActiveTreeId(tree.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] transition-colors ${
                            tree.id === activeTreeId ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <span className="font-mono font-medium">{tree.code}</span>
                          <span>{tree.items.reduce((s,i)=>s+i.qty,0)} items</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Clear Tree Confirmation */}
      <AlertDialog open={!!clearConfirmId} onOpenChange={o => !o && setClearConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Tree</AlertDialogTitle>
            <AlertDialogDescription>
              All items on this tree will be moved back to the waiting list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => clearConfirmId && handleClearTree(clearConfirmId)}
            >
              Clear Tree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
