// ============================================================
// صفحة المصمم — إدارة تصاميم المستخدم ومتابعة مهامه
// ============================================================
import React, { useState } from "react";
import { useMockState } from "@/lib/mock-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

export default function DesignerPage() {
  const { orders, customers } = useMockState();
  const [activeTab, setActiveTab] = useState("new");
  const { t } = useTranslation();

  const newAssignments = orders.filter(o => o.status === "pending" || (o.status === "approved" && o.isNewModel));
  const inDesign = orders.filter(o => o.status === "in-production" && o.isNewModel);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("designer.title")}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto p-1">
          <TabsTrigger value="new">{t("designer.newAssignments")} ({newAssignments.length})</TabsTrigger>
          <TabsTrigger value="in-design">{t("designer.inDesign")} ({inDesign.length})</TabsTrigger>
          <TabsTrigger value="print">{t("designer.awaitingPrint")}</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("designer.order")}</TableHead>
                  <TableHead>{t("designer.client")}</TableHead>
                  <TableHead>{t("designer.itemConcept")}</TableHead>
                  <TableHead>{t("designer.clientNotes")}</TableHead>
                  <TableHead className="text-end">{t("designer.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newAssignments.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.orderCode}</TableCell>
                    <TableCell>{customers.find(c=>c.id===o.clientId)?.name}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.itemName}</div>
                      {o.isNewModel && <Badge variant="secondary" className="mt-1 text-[10px]">{t("designer.customDesign")}</Badge>}
                    </TableCell>
                    <TableCell className="max-w-md text-sm text-muted-foreground">{o.notes}</TableCell>
                    <TableCell className="text-end">
                      <Button size="sm">{t("designer.startDesign")}</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {newAssignments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("designer.noAssignments")}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="in-design">
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("designer.order")}</TableHead>
                  <TableHead>{t("orders.item")}</TableHead>
                  <TableHead>{t("designer.designerNotes")}</TableHead>
                  <TableHead className="text-end">{t("designer.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inDesign.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.orderCode}</TableCell>
                    <TableCell className="font-medium">{o.itemName}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <Textarea placeholder={t("designer.cadSpecs")} className="h-16 resize-none w-full" />
                    </TableCell>
                    <TableCell className="text-end space-x-2 rtl:space-x-reverse">
                      <Button variant="outline" size="sm">{t("designer.uploadCad")}</Button>
                      <Button size="sm">{t("designer.sendToPrint")}</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {inDesign.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t("designer.noInDesign")}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="print">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("designer.printQueueNote")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
