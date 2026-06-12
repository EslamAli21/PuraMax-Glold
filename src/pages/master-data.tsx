// ============================================================
// صفحة البيانات الرئيسية — إدارة العملاء والأقسام والعمال والأختام والمواد
// ============================================================
import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Section, Machine, Worker, Customer, Material, Stamp } from "@/lib/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type TabKey = "departments" | "machines" | "workers" | "employees" | "customers" | "materials" | "stamps";

export default function MasterDataPage() {
  const { sections, machines, workers, customers, materials, stamps,
    addMachine, addWorker, addCustomer, addMaterial, addStamp } = useMockState();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("departments");
  const [search, setSearch] = useState("");
  const [dialogType, setDialogType] = useState<"add" | "edit" | null>(null);
  const [editRecord, setEditRecord] = useState<any>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState<Record<string, any>>({});

  const openAdd = () => {
    setFormData({});
    setEditRecord(null);
    setDialogType("add");
  };

  const openEdit = (record: any) => {
    setEditRecord(record);
    setFormData({ ...record });
    setDialogType("edit");
  };

  const closeDialog = () => {
    setDialogType(null);
    setEditRecord(null);
    setFormData({});
  };

  const setField = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const action = dialogType === "add" ? "Added" : "Updated";
    try {
      if (activeTab === "machines" && dialogType === "add") {
        addMachine({
          name: formData.name || "",
          serialNumber: formData.serialNumber || "",
          serialCode: formData.serialCode || "",
          brand: formData.brand || "",
          sectionId: formData.sectionId || sections[0]?.id || "",
          status: "active"
        });
      } else if (activeTab === "workers" && dialogType === "add") {
        addWorker({
          name: formData.name || "",
          sectionId: formData.sectionId || sections[0]?.id || "",
          machineId: formData.machineId || null,
          status: "active"
        });
      } else if (activeTab === "customers" && dialogType === "add") {
        addCustomer({
          name: formData.name || "",
          address: formData.address || "",
          phone: formData.phone || "",
          notes: formData.notes || ""
        });
      } else if (activeTab === "materials" && dialogType === "add") {
        addMaterial({
          name: formData.name || "",
          weight: Number(formData.weight) || 0,
          color: formData.color || "",
          isGold: formData.isGold === true || formData.isGold === "true",
          specification: formData.specification || ""
        });
      } else if (activeTab === "stamps" && dialogType === "add") {
        const karat = Number(formData.karat) || 18;
        const purity = Number(formData.purity) || 750;
        addStamp({
          karat,
          purity,
          goldPercent: purity / 10,
          pureGoldPerGram: purity / 1000,
        });
      }
      toast({ title: t("masterData.saved"), description: `${action} record successfully.` });
      closeDialog();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save record.", variant: "destructive" });
    }
  };

  const filterSearch = (items: any[], fields: string[]) =>
    items.filter(item => !search || fields.some(f => String(item[f] || "").toLowerCase().includes(search.toLowerCase())));

  const addLabels: Record<TabKey, string> = {
    departments: t("masterData.addSection"),
    machines: t("masterData.addMachine"),
    workers: t("masterData.addWorker"),
    customers: t("masterData.addCustomer"),
    materials: t("masterData.addMaterial"),
    stamps: t("masterData.addStamp"),
  };

  const renderAddEditForm = () => {
    switch (activeTab) {
      case "departments":
        return (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Department management is handled by the system administrator. Contact support to add or modify departments.</p>
          </div>
        );
      case "machines":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t("masterData.name")} *</Label><Input value={formData.name||""} onChange={e=>setField("name",e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("masterData.serialNumber")}</Label><Input value={formData.serialNumber||""} onChange={e=>setField("serialNumber",e.target.value)} className="font-mono" /></div>
              <div className="space-y-2"><Label>{t("masterData.serialCode")}</Label><Input value={formData.serialCode||""} onChange={e=>setField("serialCode",e.target.value)} className="font-mono" /></div>
            </div>
            <div className="space-y-2"><Label>{t("masterData.brand")}</Label><Input value={formData.brand||""} onChange={e=>setField("brand",e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{t("masterData.section")}</Label>
              <Select value={formData.sectionId||""} onValueChange={v=>setField("sectionId",v)}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        );
      case "workers":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t("masterData.name")} *</Label><Input value={formData.name||""} onChange={e=>setField("name",e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{t("masterData.section")}</Label>
              <Select value={formData.sectionId||""} onValueChange={v=>setField("sectionId",v)}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{sections.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("masterData.machine")}</Label>
              <Select value={formData.machineId||"none"} onValueChange={v=>setField("machineId",v==="none"?null:v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {machines.map(m=><SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "customers":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t("masterData.name")} *</Label><Input value={formData.name||""} onChange={e=>setField("name",e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("masterData.phone")}</Label><Input value={formData.phone||""} onChange={e=>setField("phone",e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("masterData.address")}</Label><Input value={formData.address||""} onChange={e=>setField("address",e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("masterData.notes")}</Label><Textarea value={formData.notes||""} onChange={e=>setField("notes",e.target.value)} className="resize-none" /></div>
          </div>
        );
      case "materials":
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{t("masterData.name")} *</Label><Input value={formData.name||""} onChange={e=>setField("name",e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("masterData.weight")}</Label><Input type="number" value={formData.weight||""} onChange={e=>setField("weight",e.target.value)} /></div>
              <div className="space-y-2"><Label>Color</Label><Input value={formData.color||""} onChange={e=>setField("color",e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>{t("masterData.specification")}</Label><Input value={formData.specification||""} onChange={e=>setField("specification",e.target.value)} /></div>
            <div className="flex items-center justify-between py-2 px-3 border rounded-md">
              <Label>{t("masterData.isGold")}</Label>
              <Switch checked={!!formData.isGold} onCheckedChange={v=>setField("isGold",v)} />
            </div>
          </div>
        );
      case "stamps":
        return (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("masterData.karat")}</Label>
                <Select value={String(formData.karat||"18")} onValueChange={v=>setField("karat",Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">18K</SelectItem>
                    <SelectItem value="21">21K</SelectItem>
                    <SelectItem value="22">22K</SelectItem>
                    <SelectItem value="24">24K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>{t("masterData.purity")}</Label><Input type="number" value={formData.purity||""} onChange={e=>setField("purity",e.target.value)} placeholder="750" /></div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("masterData.title")}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as TabKey); setSearch(""); }} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 rounded-xl flex-wrap">
          <TabsTrigger value="departments" className="rounded-lg">{t("masterData.departments")}</TabsTrigger>
          <TabsTrigger value="machines" className="rounded-lg">{t("masterData.machines")}</TabsTrigger>
          <TabsTrigger value="workers" className="rounded-lg">{t("masterData.workers")}</TabsTrigger>
          <TabsTrigger value="employees" className="rounded-lg">{t("masterData.employees")}</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg">{t("masterData.customers")}</TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg">{t("masterData.materials")}</TabsTrigger>
          <TabsTrigger value="stamps" className="rounded-lg">{t("masterData.stamps")}</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <Card className="border-sidebar-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-72">
                <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("masterData.searchRecords")}
                  className="ps-9 bg-muted/50"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 me-2" /> {addLabels[activeTab]}
              </Button>
            </CardHeader>
            <CardContent className="p-0">

              <TabsContent value="departments" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.code")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.responsible")}</TableHead>
                      <TableHead className="text-center">{t("masterData.order")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(sections, ["name","code","responsible"]).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono font-medium">{s.code}</TableCell>
                        <TableCell className="font-semibold">{s.name}</TableCell>
                        <TableCell>{s.responsible}</TableCell>
                        <TableCell className="text-center">{s.order}</TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>

              <TabsContent value="machines" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.serial")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.brand")}</TableHead>
                      <TableHead>{t("masterData.section")}</TableHead>
                      <TableHead>{t("masterData.status")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(machines, ["name","serialNumber","brand"]).map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono">{m.serialNumber}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.brand}</TableCell>
                        <TableCell>{sections.find(s=>s.id === m.sectionId)?.name}</TableCell>
                        <TableCell>
                          <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className={m.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : ''}>
                            {m.status === 'active' ? t("masterData.active") : t("masterData.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>

              <TabsContent value="workers" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.code")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.section")}</TableHead>
                      <TableHead>{t("masterData.machine")}</TableHead>
                      <TableHead>{t("masterData.status")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(workers, ["name","code"]).map(w => (
                      <TableRow key={w.id}>
                        <TableCell className="font-mono">{w.code}</TableCell>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>{sections.find(s=>s.id === w.sectionId)?.name}</TableCell>
                        <TableCell>{w.machineId ? machines.find(m=>m.id === w.machineId)?.name : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={w.status === 'active' ? 'default' : 'secondary'} className={w.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' : ''}>
                            {w.status === 'active' ? t("masterData.active") : t("masterData.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>


              <TabsContent value="employees" className="m-0 border-0">
                <div className="space-y-3">
                  {[
                    { id: "EMP-001", name: "Khalid Mansour", username: "khalid.m", email: "khalid@example.com", role: "Scale Operator", status: "pending", requestedAt: "2025-05-22 09:10" },
                    { id: "EMP-002", name: "Sara Al-Rashidi", username: "sara.r", email: "sara@example.com", role: "Designer", status: "approved", requestedAt: "2025-05-18 14:30" },
                    { id: "EMP-003", name: "Omar Faisal", username: "omar.f", email: "omar@example.com", role: "Worker", status: "pending", requestedAt: "2025-05-24 08:45" },
                    { id: "EMP-004", name: "Layla Hassan", username: "layla.h", email: "layla@example.com", role: "Section Manager", status: "rejected", requestedAt: "2025-05-15 11:20" },
                  ].filter(emp =>
                    emp.name.toLowerCase().includes(search.toLowerCase()) ||
                    emp.username.toLowerCase().includes(search.toLowerCase())
                  ).map(emp => (
                    <div key={emp.id} className="flex items-start sm:items-center justify-between flex-wrap gap-3 p-4 rounded-lg border border-border bg-card/50 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">@{emp.username} · {emp.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Role: <span className="font-medium text-foreground">{emp.role}</span> · {emp.requestedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${emp.status === "approved" ? "bg-green-500/15 text-green-600 border-green-500/30" : emp.status === "pending" ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>
                          {emp.status === "approved" ? "Approved" : emp.status === "pending" ? "Under Review" : "Rejected"}
                        </span>
                        {emp.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => toast({ title: "Approved", description: emp.name + " granted system access." })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                              onClick={() => toast({ title: "Rejected", description: emp.name + " request rejected." })}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground"><strong>Note:</strong> Employees listed here requested system access. Only approved employees can log in. Pending accounts require admin approval.</p>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.code")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.phone")}</TableHead>
                      <TableHead>{t("masterData.address")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(customers, ["name","code","phone"]).map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono">{c.code}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{c.address}</TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>

              <TabsContent value="materials" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.code")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.type")}</TableHead>
                      <TableHead>{t("masterData.stockWeight")}</TableHead>
                      <TableHead>{t("masterData.specification")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(materials, ["name","code"]).map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono">{m.code}</TableCell>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          {m.isGold ?
                            <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-0">{t("masterData.gold")}</Badge> :
                            <Badge variant="secondary">{t("masterData.nonGold")}</Badge>
                          }
                        </TableCell>
                        <TableCell className="font-mono">{m.weight}g</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.specification}</TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>

              <TabsContent value="stamps" className="m-0 border-0">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>{t("masterData.code")}</TableHead>
                      <TableHead>{t("masterData.name")}</TableHead>
                      <TableHead>{t("masterData.karat")}</TableHead>
                      <TableHead>{t("masterData.purity")}</TableHead>
                      <TableHead>{t("masterData.goldPercent")}</TableHead>
                      <TableHead className="text-end">{t("masterData.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterSearch(stamps, ["name","code"]).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono">{s.code}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.karat}K</TableCell>
                        <TableCell>{s.purity}</TableCell>
                        <TableCell className="font-mono">{s.goldPercent}%</TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </TabsContent>

            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={!!dialogType} onOpenChange={o => !o && closeDialog()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "add" ? addLabels[activeTab] : t("masterData.editRecord")}
            </DialogTitle>
          </DialogHeader>
          {renderAddEditForm()}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            {activeTab !== "departments" && (
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
