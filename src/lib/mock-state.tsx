// ============================================================
// مزوّد الحالة العامة — يوفر حالة عامة مع دوال التحديث ويحفظها في localStorage
// ============================================================
import React, { createContext, useContext, useState, useEffect } from "react";
  import {
    OrderStatus, OperationType, AlertType, AlertSeverity, Role,
    Customer, Section, Machine, Worker, Material, Stamp, ProductionStage,
    Model, Order, Movement, Alert, AuditLog,
    MOCK_CUSTOMERS, MOCK_SECTIONS, MOCK_MODELS, MOCK_MACHINES,
    MOCK_WORKERS, MOCK_STAMPS, MOCK_MATERIALS, MOCK_ORDERS, MOCK_MOVEMENTS, MOCK_ALERTS, MOCK_AUDIT_LOGS
  } from "./mock-data";

  interface MockState {
    orders: Order[]; movements: Movement[]; alerts: Alert[];
    models: Model[]; customers: Customer[]; sections: Section[];
    machines: Machine[]; workers: Worker[]; stamps: Stamp[];
    materials: Material[]; auditLogs: AuditLog[];
  }

  interface MockStateContextType extends MockState {
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    addOrder: (order: Omit<Order, "id" | "createdAt" | "orderCode">) => void;
    addMovement: (movement: Omit<Movement, "id" | "timestamp">) => void;
    markAlertRead: (alertId: string) => void;
    dismissAlert: (alertId: string) => void;
    addModel: (model: Omit<Model, "id" | "code">) => void;
    updateModel: (modelId: string, updates: Omit<Model, "id" | "code">) => void;
    deleteModel: (modelId: string) => void;
    addCustomer: (customer: Omit<Customer, "id" | "code">) => void;
    addMachine: (machine: Omit<Machine, "id">) => void;
    addWorker: (worker: Omit<Worker, "id" | "code">) => void;
    addStamp: (stamp: Omit<Stamp, "id" | "name" | "code">) => void;
    addMaterial: (material: Omit<Material, "id" | "code">) => void;
    unreadAlertsCount: number;
  }

  const MockStateContext = createContext<MockStateContextType | undefined>(undefined);

  export function MockStateProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<MockState>(() => {
      const saved = localStorage.getItem("goldFactoryMockState_v2");
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
      return {
        orders: MOCK_ORDERS, movements: MOCK_MOVEMENTS, alerts: MOCK_ALERTS,
        models: MOCK_MODELS, customers: MOCK_CUSTOMERS, sections: MOCK_SECTIONS,
        machines: MOCK_MACHINES, workers: MOCK_WORKERS, stamps: MOCK_STAMPS,
        materials: MOCK_MATERIALS, auditLogs: MOCK_AUDIT_LOGS,
      };
    });

    useEffect(() => { localStorage.setItem("goldFactoryMockState_v2", JSON.stringify(state)); }, [state]);

    const updateState = (updates: Partial<MockState>) => setState(prev => ({ ...prev, ...updates }));
    const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    const unreadAlertsCount = state.alerts.filter(a => !a.isRead && !a.isDismissed).length;

    const value: MockStateContextType = {
      ...state,
      unreadAlertsCount,
      updateOrderStatus: (orderId, status) => updateState({ orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) }),
      addOrder: (order) => updateState({ orders: [...state.orders, { ...order, id: generateId("o"), orderCode: `ORD-${Date.now().toString().slice(-3)}`, createdAt: new Date().toISOString() }] }),
      addMovement: (movement) => updateState({ movements: [{ ...movement, id: generateId("mov"), timestamp: new Date().toISOString() }, ...state.movements] }),
      markAlertRead: (alertId) => updateState({ alerts: state.alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a) }),
      dismissAlert: (alertId) => updateState({ alerts: state.alerts.map(a => a.id === alertId ? { ...a, isDismissed: true } : a) }),
      addModel: (model) => updateState({ models: [...state.models, { ...model, id: generateId("m"), code: `MOD-${Date.now().toString().slice(-4)}` }] }),
      updateModel: (modelId, updates) => updateState({ models: state.models.map(m => m.id === modelId ? { ...m, ...updates } : m) }),
      deleteModel: (modelId) => updateState({ models: state.models.filter(m => m.id !== modelId) }),
      addCustomer: (customer) => updateState({ customers: [...state.customers, { ...customer, id: generateId("c"), code: `CT-${(state.customers.length + 1).toString().padStart(2, "0")}` }] }),
      addMachine: (machine) => updateState({ machines: [...state.machines, { ...machine, id: generateId("mac") }] }),
      addWorker: (worker) => updateState({ workers: [...state.workers, { ...worker, id: generateId("w"), code: `WK-${(state.workers.length + 1).toString().padStart(3, "0")}` }] }),
      addStamp: (stamp) => updateState({ stamps: [...state.stamps, { ...stamp, id: generateId("st"), name: `${stamp.karat}K/${stamp.purity}`, code: `ST-${stamp.karat}K` }] }),
      addMaterial: (material) => updateState({ materials: [...state.materials, { ...material, id: generateId("mat"), code: `MT-${Date.now().toString().slice(-4)}` }] }),
    };

    return <MockStateContext.Provider value={value}>{children}</MockStateContext.Provider>;
  }

  export function useMockState() {
    const context = useContext(MockStateContext);
    if (!context) throw new Error("useMockState must be used within MockStateProvider");
    return context;
  }
  