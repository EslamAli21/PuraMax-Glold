// ============================================================
// الآلة الحاسبة — حساب قيمة الذهب والخسائر وتحويل الأوزان
// ============================================================
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Delete, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

const KARAT_PURITY: Record<string, number> = {
  "24K": 1.0,
  "22K": 0.9167,
  "21K": 0.875,
  "18K": 0.75,
  "14K": 0.5833,
  "10K": 0.4167,
  "9K":  0.375,
};

const GOLD_PRICE_PER_GRAM_USD = 98.5; // approximate

function NumPad({ onPress, onDelete, onClear }: { onPress: (v: string) => void; onDelete: () => void; onClear: () => void }) {
  const keys = ["7","8","9","4","5","6","1","2","3","0",".","00"];
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {keys.map(k => (
        <Button
          key={k}
          variant="outline"
          className="h-12 text-lg font-semibold bg-card hover:bg-accent/60 border-border/60"
          onClick={() => onPress(k)}
        >
          {k}
        </Button>
      ))}
      <Button variant="outline" className="h-12 bg-card hover:bg-accent/60 border-border/60" onClick={onDelete}>
        <Delete className="w-4 h-4" />
      </Button>
      <Button variant="outline" className="h-12 col-span-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30 font-semibold text-sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

function GoldValueCalc() {
  const [display, setDisplay] = useState("0");
  const [karat, setKarat] = useState("18K");

  const weight = parseFloat(display) || 0;
  const purity = KARAT_PURITY[karat] || 0.75;
  const pureGold = weight * purity;
  const value = pureGold * GOLD_PRICE_PER_GRAM_USD;

  const appendDigit = (v: string) => setDisplay(prev => {
    if (v === "." && prev.includes(".")) return prev;
    if (prev === "0" && v !== ".") return v;
    return prev + v;
  });
  const deleteChar = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  const clear = () => setDisplay("0");

  return (
    <div className="space-y-4">
      <div className="bg-sidebar rounded-xl p-4 text-right">
        <p className="text-xs text-muted-foreground mb-1">Weight (g)</p>
        <p className="text-4xl font-bold text-primary tracking-tight">{display} g</p>
        <p className="text-sm text-muted-foreground mt-1">{karat} · {(purity * 100).toFixed(1)}% pure</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {Object.keys(KARAT_PURITY).map(k => (
          <Button
            key={k}
            size="sm"
            variant={karat === k ? "default" : "outline"}
            className="h-8 text-xs font-semibold"
            onClick={() => setKarat(k)}
          >
            {k}
          </Button>
        ))}
      </div>

      <NumPad onPress={appendDigit} onDelete={deleteChar} onClear={clear} />

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pure Gold</span>
          <span className="font-semibold">{pureGold.toFixed(3)} g</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gold Price / g</span>
          <span className="font-semibold">${GOLD_PRICE_PER_GRAM_USD.toFixed(2)}</span>
        </div>
        <div className="border-t border-primary/20 pt-2 flex justify-between">
          <span className="font-bold text-primary">Est. Value</span>
          <span className="font-bold text-primary text-lg">${value.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function LossCalc() {
  const [before, setBefore] = useState("0");
  const [after, setAfter] = useState("0");
  const [active, setActive] = useState<"before" | "after">("before");

  const wBefore = parseFloat(before) || 0;
  const wAfter = parseFloat(after) || 0;
  const loss = Math.max(0, wBefore - wAfter);
  const lossPercent = wBefore > 0 ? (loss / wBefore) * 100 : 0;
  const severity = lossPercent > 5 ? "destructive" : lossPercent > 2 ? "warning" : "success";

  const appendDigit = (v: string) => {
    const setter = active === "before" ? setBefore : setAfter;
    setter(prev => {
      if (v === "." && prev.includes(".")) return prev;
      if (prev === "0" && v !== ".") return v;
      return prev + v;
    });
  };
  const deleteChar = () => { const setter = active === "before" ? setBefore : setAfter; setter(prev => prev.length > 1 ? prev.slice(0, -1) : "0"); };
  const clear = () => { setBefore("0"); setAfter("0"); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button className={`p-4 rounded-xl text-left border-2 transition-all ${active === "before" ? "border-primary bg-primary/10" : "border-border bg-card"}`} onClick={() => setActive("before")}>
          <p className="text-xs text-muted-foreground mb-1">Weight Before (g)</p>
          <p className="text-2xl font-bold">{before}</p>
        </button>
        <button className={`p-4 rounded-xl text-left border-2 transition-all ${active === "after" ? "border-primary bg-primary/10" : "border-border bg-card"}`} onClick={() => setActive("after")}>
          <p className="text-xs text-muted-foreground mb-1">Weight After (g)</p>
          <p className="text-2xl font-bold">{after}</p>
        </button>
      </div>

      <NumPad onPress={appendDigit} onDelete={deleteChar} onClear={clear} />

      <div className={`rounded-xl p-4 border space-y-3 ${lossPercent > 5 ? "bg-destructive/10 border-destructive/30" : lossPercent > 2 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30"}`}>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Material Lost</span>
          <span className="font-bold">{loss.toFixed(3)} g</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-base">Loss Rate</span>
          <span className={`text-2xl font-bold ${lossPercent > 5 ? "text-destructive" : lossPercent > 2 ? "text-yellow-500" : "text-green-500"}`}>
            {lossPercent.toFixed(2)}%
          </span>
        </div>
        {lossPercent > 5 && <p className="text-xs text-destructive font-medium">⚠ High loss detected — supervisor review required</p>}
        {lossPercent > 0 && lossPercent <= 2 && <p className="text-xs text-green-600 font-medium">✓ Loss within acceptable range</p>}
      </div>
    </div>
  );
}

function ConversionCalc() {
  const [display, setDisplay] = useState("0");
  const [unit, setUnit] = useState<"g" | "oz" | "tola">("g");

  const valueInGrams = (() => {
    const v = parseFloat(display) || 0;
    if (unit === "g") return v;
    if (unit === "oz") return v * 31.1035;
    if (unit === "tola") return v * 11.6638;
    return v;
  })();

  const appendDigit = (v: string) => setDisplay(prev => {
    if (v === "." && prev.includes(".")) return prev;
    if (prev === "0" && v !== ".") return v;
    return prev + v;
  });
  const deleteChar = () => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  const clear = () => setDisplay("0");

  const conversions = [
    { label: "Grams (g)", value: valueInGrams.toFixed(4) },
    { label: "Troy Oz", value: (valueInGrams / 31.1035).toFixed(6) },
    { label: "Tola", value: (valueInGrams / 11.6638).toFixed(4) },
    { label: "Milligrams", value: (valueInGrams * 1000).toFixed(1) },
    { label: "Carats (ct)", value: (valueInGrams * 5).toFixed(3) },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-sidebar rounded-xl p-4 text-right">
        <p className="text-xs text-muted-foreground mb-1">Input</p>
        <p className="text-4xl font-bold text-primary tracking-tight">{display}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["g","oz","tola"] as const).map(u => (
          <Button key={u} size="sm" variant={unit === u ? "default" : "outline"} className="h-9 font-semibold" onClick={() => setUnit(u)}>
            {u === "g" ? "Grams" : u === "oz" ? "Troy Oz" : "Tola"}
          </Button>
        ))}
      </div>
      <NumPad onPress={appendDigit} onDelete={deleteChar} onClear={clear} />
      <div className="rounded-xl border border-border overflow-hidden">
        {conversions.map((c, i) => (
          <div key={c.label} className={`flex justify-between items-center px-4 py-3 ${i < conversions.length - 1 ? "border-b border-border/50" : ""} hover:bg-muted/30`}>
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <span className="font-bold font-mono text-sm">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculator</h1>
        <p className="text-muted-foreground text-sm mt-1">Gold factory calculations — value, loss & conversions</p>
      </div>
      <Tabs defaultValue="value" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="value" className="text-xs font-semibold">Gold Value</TabsTrigger>
          <TabsTrigger value="loss"  className="text-xs font-semibold">Loss Calc</TabsTrigger>
          <TabsTrigger value="conv"  className="text-xs font-semibold">Convert</TabsTrigger>
        </TabsList>
        <TabsContent value="value" className="mt-4"><GoldValueCalc /></TabsContent>
        <TabsContent value="loss"  className="mt-4"><LossCalc /></TabsContent>
        <TabsContent value="conv"  className="mt-4"><ConversionCalc /></TabsContent>
      </Tabs>
    </div>
  );
}
