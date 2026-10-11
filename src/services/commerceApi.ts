import { api } from "./api";
export type Entity = "tools" | "tiers" | "offers" | "coupons";
export type Row = Record<string, unknown>;
export type AdminCatalog = Record<Entity, Row[]>;
const root = "/api/v1/admin/commerce";
export const commerceApi = {
  catalog: () => api.get<AdminCatalog>(`${root}/catalog`).then((r) => r.data),
  save: (entity: Entity, row: Row) =>
    api.put<Row>(`${root}/${entity}`, row).then((r) => r.data),
  orders: (offset = 0) =>
    api
      .get<{ items: Row[]; total: number; revenue: string; currency: string }>(
        `${root}/orders`,
        { params: { offset } },
      )
      .then((r) => r.data),
  audit: (offset = 0) =>
    api
      .get<{ items: Row[]; total: number }>(`${root}/audit`, {
        params: { offset },
      })
      .then((r) => r.data),
};
export function errorMessage(e: unknown) {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response
    ?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((d) => `${d.loc?.slice(1).join(".")}: ${d.msg}`)
      .join("; ");
  return "Unable to save. Please try again.";
}
