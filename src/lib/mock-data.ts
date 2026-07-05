// ============================================================
// ملف البيانات الوهمية — يحتوي على أنواع البيانات والقوائم الوهمية
// ============================================================
export type OrderStatus = "pending" | "approved" | "in-production" | "on-hold" | "completed" | "cancelled";
  export type OperationType = "normal" | "split" | "merge" | "tree-build" | "rework" | "scrap" | "return" | "direct-melt";
  export type AlertType = "high-loss" | "delay" | "missing-piece" | "rework" | "weight-discrepancy";
  export type AlertSeverity = "high" | "medium" | "low";
  export type Role = "Owner" | "Production Manager" | "Designer" | "3D Printer" | "Tree Responsible" | "Scale Operator" | "Section Manager" | "Worker";
  export const ALL_ROLES: Role[] = ["Owner","Production Manager","Designer","3D Printer","Tree Responsible","Scale Operator","Section Manager","Worker"];

  export interface Customer { id: string; name: string; code: string; address: string; phone: string; notes: string; }
  export interface Section { id: string; name: string; code: string; responsible: string; order: number; }
  export interface Machine { id: string; name: string; serialNumber: string; serialCode: string; brand: string; sectionId: string; status: "active" | "inactive"; }
  export interface Worker { id: string; name: string; code: string; sectionId: string; machineId: string | null; status: "active" | "inactive"; }
  export interface Material { id: string; name: string; code: string; weight: number; color: string; isGold: boolean; specification: string; }
  export interface Stamp { id: string; name: string; code: string; karat: number; purity: number; goldPercent: number; pureGoldPerGram: number; }
  export interface ProductionStage { sectionId: string; order: number; approxLossPercent: number; materialId?: string; estimatedTimeMinutes?: number; mergeWithPartIndices?: number[]; }
  export interface ModelPart { id: string; name: string; image?: string; approxWeight?: number; approxPureGoldWeight?: number; colour?: string; stages: ProductionStage[]; }
  // واجهة الموديل — تحتوي على جميع بيانات الموديل بما في ذلك الحقول الجديدة
  export interface Model {
    id: string; name: string; code: string;
    category: "rings" | "pendants" | "bracelets" | "earrings" | "chains" | "other";
    karat: number; approxWeightGrams: number;
    stages: ProductionStage[]; notes: string; image?: string; parts?: ModelPart[];
    // حقول جديدة: اللون، وزن الذهب الخالص التقريبي، نوع العينة، المواد المرتبطة
    colour?: string;                   // لون الموديل (أصفر، أبيض، وردي...)
    approxPureGoldWeightGrams?: number; // الوزن التقريبي للذهب الخالص بالغرام
    isSample?: boolean;                // هل هو عينة sample أم موديل model؟
    materialIds?: string[];            // معرّفات المواد المرتبطة بالموديل (غير الذهب)
  }
  export interface Order { id: string; orderCode: string; clientId: string; modelId: string | null; itemName: string; sizes: string; qty: number; totalWeightGrams: number; stampId: string; status: OrderStatus; deliveryDate: string; createdAt: string; notes: string; isNewModel: boolean; }
  export interface Movement { id: string; timestamp: string; qrCode: string; fromSectionId: string; toSectionId: string; workerId: string; operationType: OperationType; weightBefore: number; weightAfter: number; lossGrams: number; lossPercent: number; orderId: string; notes: string; }
  export interface Alert { id: string; type: AlertType; severity: AlertSeverity; message: string; orderId: string; sectionId: string; workerId: string; timestamp: string; isRead: boolean; isDismissed: boolean; }
  export interface AuditLog { id: string; relatedRef: string; entityType: "Order" | "Movement" | "Box" | "Tree" | "Worker" | "QC"; entityCode: string; changedField: string; oldValue: string; newValue: string; reason: string; editedBy: string; editedAt: string; approvedBy: string; severity: "critical" | "warning" | "info"; }

  const now = new Date();
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  export const MOCK_CUSTOMERS: Customer[] = [
    { id: "c1", name: "Golden Gems LLC", code: "CT-12", address: "Dubai Gold Souq", phone: "+971 50 123 4567", notes: "VIP client" },
    { id: "c2", name: "Al Noor Jewelry", code: "AC-08", address: "Riyadh, KSA", phone: "+966 50 234 5678", notes: "" },
    { id: "c3", name: "Diamond Glory", code: "DG-21", address: "Abu Dhabi", phone: "+971 55 345 6789", notes: "Prefers 18K" },
  ];

  export const MOCK_SECTIONS: Section[] = [
    { id: "s1", name: "Design", code: "SEC-01", responsible: "Ali Hassan", order: 1 },
    { id: "s2", name: "3D Print", code: "SEC-02", responsible: "Omar Khalid", order: 2 },
    { id: "s3", name: "Tree", code: "SEC-03", responsible: "Hassan Saeed", order: 3 },
    { id: "s4", name: "Casting", code: "SEC-04", responsible: "Faisal Noor", order: 4 },
    { id: "s5", name: "Finishing", code: "SEC-05", responsible: "Zaid Mahmoud", order: 5 },
    { id: "s6", name: "Stone Setting", code: "SEC-06", responsible: "Tariq Ahmed", order: 6 },
    { id: "s7", name: "QC", code: "SEC-07", responsible: "Karim Ibrahim", order: 7 },
  ];

  // بيانات الموديلات الوهمية — تشمل الحقول الجديدة: اللون، وزن الذهب الخالص، نوع العينة، المواد المرتبطة
  export const MOCK_MODELS: Model[] = [
    {
      id: "m1", name: "Classic Gold Ring", code: "RNG-1012", category: "rings", karat: 18, approxWeightGrams: 4.5,
      colour: "Yellow", approxPureGoldWeightGrams: 3.37, isSample: false, materialIds: ["mat3"],
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=450&fit=crop&q=80",
      stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s2",order:2,approxLossPercent:0},{sectionId:"s3",order:3,approxLossPercent:0},{sectionId:"s4",order:4,approxLossPercent:5},{sectionId:"s5",order:5,approxLossPercent:2},{sectionId:"s7",order:6,approxLossPercent:0}],
      parts: [
        { id: "p1-1", name: "Band", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s4",order:1,approxLossPercent:5},{sectionId:"s5",order:2,approxLossPercent:2},{sectionId:"s7",order:3,approxLossPercent:0}] },
        { id: "p1-2", name: "Setting", image: "https://images.unsplash.com/photo-1633810542706-90e5ff7557be?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s6",order:2,approxLossPercent:1},{sectionId:"s7",order:3,approxLossPercent:0}] },
      ],
      notes: ""
    },
    {
      id: "m2", name: "Leaf Pendant", code: "PEN-2045", category: "pendants", karat: 18, approxWeightGrams: 6.8,
      colour: "White", approxPureGoldWeightGrams: 5.1, isSample: false, materialIds: ["mat3", "mat4"],
      image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=450&fit=crop&q=80",
      stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s2",order:2,approxLossPercent:0},{sectionId:"s3",order:3,approxLossPercent:0},{sectionId:"s4",order:4,approxLossPercent:6},{sectionId:"s5",order:5,approxLossPercent:3},{sectionId:"s7",order:6,approxLossPercent:0}],
      parts: [
        { id: "p2-1", name: "Leaf Body", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s4",order:2,approxLossPercent:6},{sectionId:"s5",order:3,approxLossPercent:3}] },
        { id: "p2-2", name: "Bail", image: "https://images.unsplash.com/photo-1629796736279-9f1c0c9acf27?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s4",order:1,approxLossPercent:2},{sectionId:"s7",order:2,approxLossPercent:0}] },
      ],
      notes: ""
    },
    {
      id: "m3", name: "Twist Bangle", code: "BGL-3108", category: "bracelets", karat: 22, approxWeightGrams: 22,
      colour: "Yellow", approxPureGoldWeightGrams: 20.15, isSample: true, materialIds: [],
      image: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=450&fit=crop&q=80",
      stages: [{sectionId:"s4",order:1,approxLossPercent:4},{sectionId:"s5",order:2,approxLossPercent:2},{sectionId:"s7",order:3,approxLossPercent:0}],
      notes: ""
    },
    {
      id: "m4", name: "Drop Earrings", code: "EER-4022", category: "earrings", karat: 18, approxWeightGrams: 5.2,
      colour: "Rose", approxPureGoldWeightGrams: 3.9, isSample: false, materialIds: ["mat3", "mat4"],
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=450&fit=crop&q=80",
      stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s4",order:2,approxLossPercent:5},{sectionId:"s5",order:3,approxLossPercent:2},{sectionId:"s7",order:4,approxLossPercent:0}],
      parts: [
        { id: "p4-1", name: "Top Hook", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s4",order:1,approxLossPercent:3},{sectionId:"s5",order:2,approxLossPercent:1}] },
        { id: "p4-2", name: "Drop Body", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop&q=80", stages: [{sectionId:"s1",order:1,approxLossPercent:0},{sectionId:"s4",order:2,approxLossPercent:5},{sectionId:"s6",order:3,approxLossPercent:1},{sectionId:"s7",order:4,approxLossPercent:0}] },
      ],
      notes: ""
    },
    {
      id: "m5", name: "Rope Chain", code: "CHN-5023", category: "chains", karat: 18, approxWeightGrams: 14,
      colour: "Yellow", approxPureGoldWeightGrams: 10.5, isSample: false, materialIds: ["mat3"],
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=450&fit=crop&q=80",
      stages: [{sectionId:"s4",order:1,approxLossPercent:3},{sectionId:"s5",order:2,approxLossPercent:1.5},{sectionId:"s7",order:3,approxLossPercent:0}],
      notes: ""
    },
  ];

  export const MOCK_MACHINES: Machine[] = [
    { id: "mac1", name: "3D Printer Pro X", serialNumber: "3DP-1001", serialCode: "3D-01", brand: "EnvisionTEC", sectionId: "s2", status: "active" },
    { id: "mac2", name: "Casting Furnace", serialNumber: "CF-2001", serialCode: "CF-01", brand: "Indutherm", sectionId: "s4", status: "active" },
    { id: "mac3", name: "Polishing Motor A", serialNumber: "PM-3001", serialCode: "PM-01", brand: "Otec", sectionId: "s5", status: "active" },
    { id: "mac4", name: "Setting Microscope", serialNumber: "SM-4001", serialCode: "SM-01", brand: "Leica", sectionId: "s6", status: "active" },
    { id: "mac5", name: "X-Ray Tester", serialNumber: "XR-5001", serialCode: "XR-01", brand: "Fischer", sectionId: "s7", status: "active" },
  ];

  export const MOCK_WORKERS: Worker[] = [
    { id: "w1", name: "Ahmad Nasser", code: "WK-001", sectionId: "s1", machineId: null, status: "active" },
    { id: "w2", name: "Bilal Tariq", code: "WK-002", sectionId: "s2", machineId: "mac1", status: "active" },
    { id: "w3", name: "Khaled Saeed", code: "WK-003", sectionId: "s3", machineId: null, status: "active" },
    { id: "w4", name: "Saeed Yousef", code: "WK-004", sectionId: "s4", machineId: "mac2", status: "active" },
    { id: "w5", name: "Yousef Zaid", code: "WK-005", sectionId: "s5", machineId: "mac3", status: "active" },
    { id: "w6", name: "Mahmoud Ali", code: "WK-006", sectionId: "s6", machineId: "mac4", status: "active" },
    { id: "w7", name: "Omar Ibrahim", code: "WK-007", sectionId: "s7", machineId: "mac5", status: "active" },
  ];

  export const MOCK_STAMPS: Stamp[] = [
    { id: "st1", name: "18K / 750", code: "ST-18K", karat: 18, purity: 750, goldPercent: 75.0, pureGoldPerGram: 0.75 },
    { id: "st2", name: "21K / 875", code: "ST-21K", karat: 21, purity: 875, goldPercent: 87.5, pureGoldPerGram: 0.875 },
    { id: "st3", name: "22K / 916", code: "ST-22K", karat: 22, purity: 916, goldPercent: 91.6, pureGoldPerGram: 0.916 },
    { id: "st4", name: "24K / 999", code: "ST-24K", karat: 24, purity: 999, goldPercent: 99.9, pureGoldPerGram: 0.999 },
  ];

  export const MOCK_MATERIALS: Material[] = [
    { id: "mat1", name: "Yellow Gold 18K", code: "MT-YG18", weight: 5000, color: "Yellow", isGold: true, specification: "Standard alloy" },
    { id: "mat2", name: "White Gold 18K", code: "MT-WG18", weight: 2000, color: "White", isGold: true, specification: "Palladium alloy" },
    { id: "mat3", name: "Silver", code: "MT-AG", weight: 10000, color: "Silver", isGold: false, specification: "999 fine" },
    { id: "mat4", name: "Polishing Compound", code: "MT-POL", weight: 800, color: "Grey", isGold: false, specification: "Medium grit" },
  ];

  export const MOCK_ORDERS: Order[] = [
    { id: "o1", orderCode: "ORD-503", clientId: "c1", modelId: "m1", itemName: "Classic Gold Ring", sizes: "16,17,18", qty: 80, totalWeightGrams: 360, stampId: "st1", status: "in-production", deliveryDate: d(-3), createdAt: d(8), notes: "Priority order", isNewModel: false },
    { id: "o2", orderCode: "ORD-502", clientId: "c2", modelId: "m2", itemName: "Leaf Pendant", sizes: "One Size", qty: 50, totalWeightGrams: 340, stampId: "st1", status: "approved", deliveryDate: d(5), createdAt: d(6), notes: "", isNewModel: false },
    { id: "o3", orderCode: "ORD-501", clientId: "c3", modelId: "m3", itemName: "Twist Bangle", sizes: "18cm,20cm", qty: 40, totalWeightGrams: 880, stampId: "st3", status: "pending", deliveryDate: d(10), createdAt: d(4), notes: "Under review", isNewModel: false },
    { id: "o4", orderCode: "ORD-500", clientId: "c1", modelId: null, itemName: "Custom Diamond Ring", sizes: "17", qty: 5, totalWeightGrams: 25, stampId: "st1", status: "pending", deliveryDate: d(7), createdAt: d(3), notes: "New model — needs design", isNewModel: true },
    { id: "o5", orderCode: "ORD-499", clientId: "c2", modelId: "m4", itemName: "Drop Earrings", sizes: "One Size", qty: 100, totalWeightGrams: 520, stampId: "st1", status: "on-hold", deliveryDate: d(-1), createdAt: d(10), notes: "Waiting for stone delivery", isNewModel: false },
    { id: "o6", orderCode: "ORD-498", clientId: "c3", modelId: "m5", itemName: "Rope Chain 18K", sizes: "45cm", qty: 20, totalWeightGrams: 280, stampId: "st1", status: "completed", deliveryDate: d(-10), createdAt: d(20), notes: "", isNewModel: false },
  ];

  export const MOCK_MOVEMENTS: Movement[] = [
    { id: "mov1", timestamp: d(3), qrCode: "QR-ORD503-A", fromSectionId: "s1", toSectionId: "s2", workerId: "w1", operationType: "normal", weightBefore: 0, weightAfter: 0, lossGrams: 0, lossPercent: 0, orderId: "o1", notes: "Design completed, sent to 3D printing" },
    { id: "mov2", timestamp: d(2.5), qrCode: "QR-ORD503-A", fromSectionId: "s2", toSectionId: "s3", workerId: "w2", operationType: "normal", weightBefore: 0, weightAfter: 0, lossGrams: 0, lossPercent: 0, orderId: "o1", notes: "3D models ready" },
    { id: "mov3", timestamp: d(2), qrCode: "TR-001125", fromSectionId: "s3", toSectionId: "s4", workerId: "w3", operationType: "tree-build", weightBefore: 380, weightAfter: 375, lossGrams: 5, lossPercent: 1.3, orderId: "o1", notes: "Tree built, sent to casting" },
    { id: "mov4", timestamp: d(1.5), qrCode: "TR-001125", fromSectionId: "s4", toSectionId: "s5", workerId: "w4", operationType: "normal", weightBefore: 375, weightAfter: 352, lossGrams: 23, lossPercent: 6.1, orderId: "o1", notes: "Casting complete — high loss flagged" },
    { id: "mov5", timestamp: d(1), qrCode: "BOX-044A", fromSectionId: "s5", toSectionId: "s7", workerId: "w5", operationType: "normal", weightBefore: 352, weightAfter: 347, lossGrams: 5, lossPercent: 1.4, orderId: "o1", notes: "Finishing done" },
    { id: "mov6", timestamp: d(0.5), qrCode: "QR-ORD502-B", fromSectionId: "s1", toSectionId: "s2", workerId: "w1", operationType: "normal", weightBefore: 0, weightAfter: 0, lossGrams: 0, lossPercent: 0, orderId: "o2", notes: "Design sent to print" },
    { id: "mov7", timestamp: d(5), qrCode: "BOX-032A", fromSectionId: "s4", toSectionId: "s5", workerId: "w4", operationType: "rework", weightBefore: 95, weightAfter: 94, lossGrams: 1, lossPercent: 1.1, orderId: "o5", notes: "Rework after QC rejection" },
    { id: "mov8", timestamp: d(12), qrCode: "QR-ORD498-F", fromSectionId: "s5", toSectionId: "s7", workerId: "w5", operationType: "normal", weightBefore: 285, weightAfter: 282, lossGrams: 3, lossPercent: 1.1, orderId: "o6", notes: "Final QC pass" },
  ];

  export const MOCK_ALERTS: Alert[] = [
    { id: "a1", type: "high-loss", severity: "high", message: "High loss in Casting (6.1%) — ORD-503 Tree TR-001125", orderId: "o1", sectionId: "s4", workerId: "w4", timestamp: d(1.5), isRead: false, isDismissed: false },
    { id: "a2", type: "delay", severity: "medium", message: "ORD-499 overdue — waiting on stone delivery", orderId: "o5", sectionId: "s6", workerId: "w6", timestamp: d(0.5), isRead: false, isDismissed: false },
    { id: "a3", type: "rework", severity: "medium", message: "ORD-499 BOX-032A sent back for rework from QC", orderId: "o5", sectionId: "s7", workerId: "w7", timestamp: d(4.9), isRead: false, isDismissed: false },
    { id: "a4", type: "weight-discrepancy", severity: "low", message: "Weight variance recorded in Finishing — BOX-044A", orderId: "o1", sectionId: "s5", workerId: "w5", timestamp: d(1), isRead: true, isDismissed: false },
    { id: "a5", type: "missing-piece", severity: "high", message: "1 piece missing from BOX-032A after rework", orderId: "o5", sectionId: "s5", workerId: "w5", timestamp: d(4.5), isRead: false, isDismissed: false },
  ];

  export const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: "chg1", relatedRef: "MOV-mov4", entityType: "Movement", entityCode: "TR-001125", changedField: "Weight After (g)", oldValue: "360", newValue: "352", reason: "Corrected after recount", editedBy: "Saeed Yousef", editedAt: d(1.4), approvedBy: "Owner", severity: "critical" },
    { id: "chg2", relatedRef: "ORD-503", entityType: "Order", entityCode: "ORD-503", changedField: "Delivery Date", oldValue: "May 12, 2025", newValue: "May 18, 2025", reason: "Client requested extension", editedBy: "Ahmad Nasser", editedAt: d(4), approvedBy: "Production Manager", severity: "warning" },
    { id: "chg3", relatedRef: "MOV-mov7", entityType: "Box", entityCode: "BOX-032A", changedField: "Status", oldValue: "In Production", newValue: "On Hold", reason: "Quality hold for review", editedBy: "Omar Ibrahim", editedAt: d(4.8), approvedBy: "Owner", severity: "warning" },
    { id: "chg4", relatedRef: "ORD-499", entityType: "Order", entityCode: "ORD-499", changedField: "Notes", oldValue: "", newValue: "Waiting for stone delivery", reason: "Stone supplier delayed", editedBy: "Ahmad Nasser", editedAt: d(0.5), approvedBy: "Production Manager", severity: "info" },
    { id: "chg5", relatedRef: "MOV-mov5", entityType: "Movement", entityCode: "BOX-044A", changedField: "Loss %", oldValue: "2.1", newValue: "1.4", reason: "Scale calibration error corrected", editedBy: "Yousef Zaid", editedAt: d(0.9), approvedBy: "Owner", severity: "critical" },
  ];
