import type { CapacitySheet } from "../types/capacity";

/** Local fallback only — production data lives in Supabase per team. */
const DEFAULT_PROJECTS = [
  "Lotte",
  "XtraSure",
  "Padesar",
  "Zuellig",
  "Mastercard",
  "Internal",
];

export function createSeedSheet(teamId = "local"): CapacitySheet {
  return {
    id: "local",
    teamId,
    label: "April 2026",
    month: "April",
    year: 2026,
    projects: [...DEFAULT_PROJECTS],
    members: [
      {
        id: "m1",
        name: "Theint Theint",
        pod: "AD",
        role: "Associate Director",
        allocations: {
          Lotte: 20,
          XtraSure: 40,
          Padesar: 5,
          Zuellig: 10,
          Mastercard: 0,
          Internal: 0,
        },
      },
      {
        id: "m2",
        name: "May Thu Thu Ko",
        pod: "Pod B + A",
        role: "Account Manager",
        allocations: {
          Lotte: 20,
          XtraSure: 15,
          Padesar: 20,
          Zuellig: 30,
          Mastercard: 0,
          Internal: 0,
        },
      },
      {
        id: "m3",
        name: "Wadi Tun Naing",
        pod: "Pod A + B",
        role: "Account Manager",
        allocations: {
          Lotte: 10,
          XtraSure: 30,
          Padesar: 0,
          Zuellig: 0,
          Mastercard: 0,
          Internal: 0,
        },
      },
      {
        id: "m4",
        name: "Alan",
        pod: "Pod B + A",
        role: "Senior Executive",
        allocations: {
          Lotte: 0,
          XtraSure: 20,
          Padesar: 0,
          Zuellig: 20,
          Mastercard: 0,
          Internal: 0,
        },
      },
      {
        id: "m5",
        name: "Saw Thazin Soe",
        pod: "Shared",
        role: "Senior Executive",
        allocations: {
          Lotte: 10,
          XtraSure: 10,
          Padesar: 0,
          Zuellig: 10,
          Mastercard: 10,
          Internal: 0,
        },
      },
    ],
  };
}
