// ============================================================
// صفحة الطلبات الواردة الجديدة — استقبال ومعالجة الطلبات الجديدة
// ============================================================
import React, { useState } from "react";
// استيراد مكوّن الصورة القابلة للتكبير — تكبير عند المرور، نافذة ضوئية عند النقر
import { ZoomableImage } from "@/components/ui/zoomable-image";
import { useMockState } from "@/lib/mock-state";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, PauseCircle, Package, Clock, Eye, FileText, Printer, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "@/lib/mock-data";

// ── خريطة ألوان حالات الطلب — تُحدد ألوان الشارات حسب حالة الطلب ──
const statusColors: Record<string, string> = {
  pending:         "bg-blue-500/15 text-blue-400 border-blue-500/30",   // معلق — أزرق
  approved:        "bg-green-500/15 text-green-400 border-green-500/30", // معتمد — أخضر
  "in-production": "bg-primary/15 text-primary border-primary/30",       // في الإنتاج — أساسي
  "on-hold":       "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", // متوقف — أصفر
  completed:       "bg-muted text-muted-foreground border-border",       // مكتمل — رمادي
  cancelled:       "bg-destructive/15 text-destructive border-destructive/30", // ملغى — أحمر
};

// ── خريطة ألوان مسارات الإنتاج — تُحدد لون مسار كل طلب ──
const routeColors: Record<string, string> = {
  "direct-melt": "bg-red-500/20 text-red-400",    // صهر مباشر — أحمر
  "tree":        "bg-green-500/20 text-green-400", // شجرة ذهب — أخضر
  "mixed":       "bg-blue-500/20 text-blue-400",   // مسار مختلط — أزرق
  "new":         "bg-purple-500/20 text-purple-400", // موديل جديد — بنفسجي
};

// ── تحديد مسار الإنتاج المقترح للطلب بناءً على خصائصه ──
// المنطق: موديل جديد → مسار التصميم / وزن كبير → شجرة / غير ذلك → مختلط
function getRoute(order: Order) {
  if (order.isNewModel) return "New";           // موديل مخصص جديد → مسار التصميم
  if (order.totalWeightGrams > 300) return "Tree"; // وزن كبير → شجرة ذهب
  return "Mixed";                               // باقي الطلبات → مسار مختلط
}

export default function NewOrdersPage() {
  const { t } = useTranslation();
  const { orders, customers, models, sections, stamps, updateOrderStatus } = useMockState();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [managerNote, setManagerNote] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});

  const tabFilter: Record<string, OrderStatus[]> = {
    new: ["pending"],
    review: ["pending"],
    hold: ["on-hold"],
    approved: ["approved"],
    all: ["pending","approved","in-production","on-hold","completed","cancelled"],
  };

  const filtered = orders.filter(o => {
    const statuses = tabFilter[activeTab] || [];
    const matchTab = statuses.includes(o.status);
    const matchSearch = !search || o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      customers.find(c => c.id === o.clientId)?.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    new: orders.filter(o => o.status === "pending").length,
    review: orders.filter(o => o.status === "pending").length,
    hold: orders.filter(o => o.status === "on-hold").length,
    approved: orders.filter(o => o.status === "approved").length,
    all: orders.length,
  };

  const handleApprove = () => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, "approved");
    toast({ title: "Order Approved", description: `${selectedOrder.orderCode} moved to production.` });
    setSelectedOrder({ ...selectedOrder, status: "approved" });
  };

  const handleHold = () => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, "on-hold");
    toast({ title: "Order On Hold", description: `${selectedOrder.orderCode} placed on hold.` });
    setSelectedOrder({ ...selectedOrder, status: "on-hold" });
  };

  const handleSaveDecision = () => {
    if (!selectedOrder) return;
    setSavedNotes(prev => ({ ...prev, [selectedOrder.id]: managerNote }));
    toast({ title: "Decision Saved", description: `Note saved for ${selectedOrder.orderCode}.` });
  };

  const handlePrintApproved = () => {
    if (!selectedOrder) return;
    toast({ title: "Printing Order Sheet", description: `Sending ${selectedOrder.orderCode} approval sheet to printer.` });
  };

  const orderClient = selectedOrder ? customers.find(c => c.id === selectedOrder.clientId) : null;
  const orderModel = selectedOrder?.modelId ? models.find(m => m.id === selectedOrder.modelId) : null;
  const orderStamp = selectedOrder ? stamps.find(s => s.id === selectedOrder.stampId) : null;
  const orderSections = orderModel?.stages?.map(s => sections.find(sec => sec.id === s.sectionId)?.name).filter(Boolean) || [];

  const kpiCards = [
    { label: "New Orders", value: counts.new, icon: Package, color: "text-blue-400", sub: "View new orders →" },
    { label: "Waiting Approval", value: counts.review, icon: Clock, color: "text-yellow-400", sub: "Under review →" },
    { label: "On Hold", value: counts.hold, icon: PauseCircle, color: "text-orange-400", sub: "On hold items →" },
    { label: "Approved Today", value: counts.approved, icon: CheckCircle2, color: "text-green-400", sub: "View approved →" },
  ];

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{t("newOrders.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("newOrders.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <card.icon className={`h-8 w-8 mt-1 ${card.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT: Order List */}
        <div className="flex-1 min-w-0">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search order code or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full rounded-none border-b border-border/50 h-9 bg-transparent justify-start px-4 gap-1 overflow-x-auto">
                  {[
                    { key: "new", label: "New", count: counts.new },
                    { key: "review", label: "Under Review", count: counts.review },
                    { key: "hold", label: "On Hold", count: counts.hold },
                    { key: "approved", label: "Approved", count: counts.approved },
                    { key: "all", label: "All", count: counts.all },
                  ].map(tab => (
                    <TabsTrigger key={tab.key} value={tab.key} className="text-xs h-7 gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      {tab.label}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{tab.count}</Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-xs w-24">Order</TableHead>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Weight</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Route</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No orders found</TableCell></TableRow>
                    )}
                    {filtered.map(order => {
                      const client = customers.find(c => c.id === order.clientId);
                      const route = getRoute(order);
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <TableRow key={order.id}
                          className={`cursor-pointer border-border/50 ${isSelected ? "bg-primary/10" : "hover:bg-muted/30"}`}
                          onClick={() => { setSelectedOrder(order); setSelectedItems(new Set()); setManagerNote(savedNotes[order.id] || ""); }}>
                          <TableCell className="font-mono text-xs font-medium">{order.orderCode}</TableCell>
                          <TableCell className="text-xs">
                            <div>{client?.name || "—"}</div>
                            <div className="text-muted-foreground">{client?.code}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs hidden md:table-cell">{order.totalWeightGrams}g</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${routeColors[route.toLowerCase()] || "bg-muted text-muted-foreground"}`}>{route}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColors[order.status]}`}>
                              {order.status.replace("-", " ")}
                            </span>
                          </TableCell>
                          <TableCell><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Order Summary Panel */}
        <div className="w-full lg:w-[420px] shrink-0">
          {!selectedOrder ? (
            <Card className="border-border/50 h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t("newOrders.noOrderSelected")}</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Summary Header */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{t("newOrders.orderSummary")}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColors[selectedOrder.status]}`}>
                          {selectedOrder.status.replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedOrder.orderCode}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div><span className="text-muted-foreground">Order Code</span><p className="font-mono font-medium">{selectedOrder.orderCode}</p></div>
                    <div><span className="text-muted-foreground">Client</span><p className="font-medium">{orderClient?.name}</p></div>
                    <div><span className="text-muted-foreground">Order Date</span><p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p></div>
                    <div><span className="text-muted-foreground">Delivery Date</span><p className={new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== "completed" ? "text-destructive font-bold" : ""}>{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p></div>
                    <div><span className="text-muted-foreground">Total Weight</span><p className="font-medium text-primary">{selectedOrder.totalWeightGrams}g</p></div>
                    <div><span className="text-muted-foreground">Stamp</span><p>{orderStamp?.name || selectedOrder.stampId}</p></div>
                  </div>
                </CardContent>
              </Card>

              {/* Items in Order */}
              <Card className="border-border/50">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">{t("newOrders.itemsInOrder")} (1)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[10px] w-8 pl-3"><Checkbox /></TableHead>
                        {/* ── عمود صورة الموديل ── */}
                        <TableHead className="text-[10px]">صورة</TableHead>
                        <TableHead className="text-[10px]">Model</TableHead>
                        <TableHead className="text-[10px]">Karat</TableHead>
                        <TableHead className="text-[10px]">Qty</TableHead>
                        <TableHead className="text-[10px]">Weight</TableHead>
                        <TableHead className="text-[10px]">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-border/50">
                        <TableCell className="pl-3"><Checkbox checked={selectedItems.has(selectedOrder.id)} onCheckedChange={v => {
                          const s = new Set(selectedItems);
                          if (v) s.add(selectedOrder.id); else s.delete(selectedOrder.id);
                          setSelectedItems(s);
                        }} /></TableCell>
                        {/* ── صورة الموديل مأخوذة من بيانات الموديل المرتبط بالطلب ── */}
                        <TableCell>
                          {orderModel?.image ? (
                            /* صورة الموديل — تتكبّر عند المرور وتفتح نافذة ضوئية عند النقر */
                            <ZoomableImage src={orderModel.image} alt={orderModel.name} className="w-10 h-10 object-cover rounded-md border border-border/50" />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-[9px] text-muted-foreground border border-border/50">—</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{selectedOrder.itemName}</div>
                          <div className="text-muted-foreground">{orderModel?.code || "New Model"}</div>
                        </TableCell>
                        <TableCell className="text-xs">{orderStamp?.karat ? `${orderStamp.karat}K` : "—"}</TableCell>
                        <TableCell className="text-xs">{selectedOrder.qty}</TableCell>
                        <TableCell className="text-xs text-primary font-medium">{selectedOrder.totalWeightGrams}g</TableCell>
                        <TableCell className="text-xs">
                          {selectedOrder.status === "approved"
                            ? <span className="text-green-500 font-medium">Approved</span>
                            : selectedOrder.status === "on-hold"
                            ? <span className="text-yellow-500 font-medium">On Hold</span>
                            : <span className="text-muted-foreground italic">Pending</span>
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Production Route */}
              {orderSections.length > 0 && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium mb-2">{t("newOrders.productionRoute")}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {orderSections.map((sec, i) => (
                        <React.Fragment key={i}>
                          <span className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium">{sec}</span>
                          {i < orderSections.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manager Note */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-medium mb-2">{t("newOrders.managerNote")}</p>
                  <Textarea
                    value={managerNote}
                    onChange={e => setManagerNote(e.target.value)}
                    placeholder={t("newOrders.addNote")}
                    className="text-xs min-h-[60px] resize-none"
                  />
                  {savedNotes[selectedOrder.id] && (
                    <p className="text-[10px] text-green-500 mt-1">Note saved</p>
                  )}
                </CardContent>
              </Card>

              {/* Approval Actions */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="text-xs gap-1.5" onClick={handleApprove}
                      disabled={selectedOrder.status === "approved"}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t("newOrders.approveFullOrder")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={handleHold}
                      disabled={selectedOrder.status === "on-hold"}>
                      <PauseCircle className="h-3.5 w-3.5" /> {t("newOrders.putOnHold")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 col-span-1" onClick={handleSaveDecision}>
                      <FileText className="h-3.5 w-3.5" /> {t("newOrders.saveDecision")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 col-span-1" onClick={handlePrintApproved}>
                      <Printer className="h-3.5 w-3.5" /> {t("newOrders.printApproved")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
