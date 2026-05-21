import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Order, OrderStatus } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Play, PauseCircle, CheckCircle, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case "pending": return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    case "approved": return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 border-green-200 dark:border-green-800";
    case "in-production": return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "on-hold": return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-800";
    default: return "";
  }
};

const newOrderSchema = z.object({
  clientId: z.string().min(1),
  modelId: z.string().optional().or(z.literal("")),
  itemName: z.string().min(1),
  sizes: z.string().min(1),
  qty: z.coerce.number().min(1),
  totalWeightGrams: z.coerce.number().min(1),
  stampId: z.string().min(1),
  deliveryDate: z.string().min(1),
  notes: z.string(),
  isNewModel: z.boolean().default(false),
});

export default function OrdersPage() {
  const { orders, customers, models, stamps, updateOrderStatus, addOrder } = useMockState();
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionOrder, setActionOrder] = useState<{ orderId: string, action: string } | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const STATUS_TABS: { labelKey: string; value: OrderStatus }[] = [
    { labelKey: "orders.pending", value: "pending" },
    { labelKey: "orders.approved", value: "approved" },
    { labelKey: "orders.inProduction", value: "in-production" },
    { labelKey: "orders.onHold", value: "on-hold" },
    { labelKey: "orders.completed", value: "completed" },
    { labelKey: "orders.cancelled", value: "cancelled" },
  ];

  const form = useForm<z.infer<typeof newOrderSchema>>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      clientId: "", modelId: "", itemName: "", sizes: "", qty: 1, totalWeightGrams: 10, stampId: "", deliveryDate: "", notes: "", isNewModel: false
    }
  });

  const getClientName = (id: string) => customers.find(c => c.id === id)?.name || id;
  const getModelName = (id: string | null) => id ? (models.find(m => m.id === id)?.name || id) : t("orders.customModel");
  const getStampName = (id: string) => stamps.find(s => s.id === id)?.name || id;

  const handleActionConfirm = () => {
    if (!actionOrder) return;
    const { orderId, action } = actionOrder;
    if (action === "approve") updateOrderStatus(orderId, "approved");
    if (action === "hold") updateOrderStatus(orderId, "on-hold");
    if (action === "start") updateOrderStatus(orderId, "in-production");
    toast({ title: "Order Updated", description: "Order status changed successfully." });
    setActionOrder(null);
  };

  const onNewOrderSubmit = (data: z.infer<typeof newOrderSchema>) => {
    addOrder({ ...data, status: "pending", modelId: data.modelId || null });
    setIsNewOrderOpen(false);
    toast({ title: "Order Created", description: "New order added to pending approvals." });
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("orders.title")}</h1>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="w-4 h-4 me-2" /> {t("orders.newOrder")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("orders.createNewOrder")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onNewOrderSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.client")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t("orders.selectClient")} /></SelectTrigger></FormControl>
                        <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="stampId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.stampKarat")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t("orders.selectStamp")} /></SelectTrigger></FormControl>
                        <SelectContent>{stamps.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="isNewModel" render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("orders.customNewModel")}</FormLabel>
                    </div>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  {!form.watch("isNewModel") && (
                    <FormField control={form.control} name="modelId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("models.title")}</FormLabel>
                        <Select onValueChange={(val) => {
                          field.onChange(val);
                          const m = models.find(mo => mo.id === val);
                          if (m) form.setValue("itemName", m.name);
                        }} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder={t("orders.selectModel")} /></SelectTrigger></FormControl>
                          <SelectContent>{models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="itemName" render={({ field }) => (
                    <FormItem className={form.watch("isNewModel") ? "col-span-2" : ""}>
                      <FormLabel>{t("orders.itemName")}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="qty" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.quantity")}</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalWeightGrams" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.totalWeight")}</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sizes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.sizes")}</FormLabel>
                      <FormControl><Input placeholder={t("orders.sizesPlaceholder")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orders.deliveryDate")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orders.notes")}</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full">{t("orders.createOrder")}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus)} className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1 bg-muted/50">
          {STATUS_TABS.map(tab => {
            const count = orders.filter(o => o.status === tab.value).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex gap-2">
                {t(tab.labelKey)}
                <Badge variant="secondary" className="px-1.5 min-w-[1.5rem] flex justify-center text-[10px]">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orders.orderCode")}</TableHead>
                  <TableHead>{t("orders.client")}</TableHead>
                  <TableHead>{t("orders.item")}</TableHead>
                  <TableHead>{t("orders.qty")}</TableHead>
                  <TableHead>{t("orders.weight")}</TableHead>
                  <TableHead>{t("orders.karat")}</TableHead>
                  <TableHead>{t("orders.delivery")}</TableHead>
                  <TableHead>{t("orders.status")}</TableHead>
                  <TableHead className="text-end">{t("orders.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.filter(o => o.status === activeTab).map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-medium">{order.orderCode}</TableCell>
                    <TableCell className="font-medium">{getClientName(order.clientId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.itemName}</span>
                        {order.modelId && <span className="text-xs text-muted-foreground">{getModelName(order.modelId)}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{order.qty}</TableCell>
                    <TableCell>{order.totalWeightGrams}g</TableCell>
                    <TableCell>{getStampName(order.stampId)}</TableCell>
                    <TableCell>
                      <span className={new Date(order.deliveryDate) < new Date() && order.status !== "completed" ? "text-destructive font-bold" : ""}>
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeVariant(order.status)}>
                        {order.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end space-x-2 rtl:space-x-reverse">
                      {order.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => setActionOrder({ orderId: order.id, action: "approve" })}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100" onClick={() => setActionOrder({ orderId: order.id, action: "hold" })}>
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {order.status === "approved" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100" onClick={() => setActionOrder({ orderId: order.id, action: "start" })}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === "in-production" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100" onClick={() => setActionOrder({ orderId: order.id, action: "hold" })}>
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.filter(o => o.status === activeTab).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      {t("orders.noOrdersFound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </Tabs>

      <AlertDialog open={!!actionOrder} onOpenChange={(o) => !o && setActionOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("orders.confirmAction")}</AlertDialogTitle>
            <AlertDialogDescription>{t("orders.confirmQuestion")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("orders.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>{t("orders.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-mono">{selectedOrder.orderCode}</SheetTitle>
                  <Badge variant="outline" className={getStatusBadgeVariant(selectedOrder.status)}>
                    {selectedOrder.status.replace("-", " ")}
                  </Badge>
                </div>
                <SheetDescription className="text-base text-foreground font-medium">
                  {getClientName(selectedOrder.clientId)}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.item")}</p>
                    <p className="font-medium">{selectedOrder.itemName}</p>
                    {selectedOrder.isNewModel && <Badge variant="secondary" className="mt-1 text-[10px]">{t("orders.customModel")}</Badge>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.modelCode")}</p>
                    <p className="font-medium font-mono">{selectedOrder.modelId ? getModelName(selectedOrder.modelId) : t("orders.na")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.quantitySizes")}</p>
                    <p className="font-medium">{selectedOrder.qty} {t("orders.pcs")} ({selectedOrder.sizes})</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.totalWeight")}</p>
                    <p className="font-medium">{selectedOrder.totalWeightGrams}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.stampKarat")}</p>
                    <p className="font-medium">{getStampName(selectedOrder.stampId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("orders.deliveryDate")}</p>
                    <p className={new Date(selectedOrder.deliveryDate) < new Date() && selectedOrder.status !== "completed" ? "text-destructive font-bold" : "font-medium"}>
                      {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">{t("orders.notes")}</h3>
                  <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                    {selectedOrder.notes || t("orders.noNotes")}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
