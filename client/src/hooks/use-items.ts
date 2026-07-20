import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Parse error response consistently
async function parseErrorResponse(res: Response): Promise<{ message: string; code?: string }> {
  try {
    const data = await res.json();
    return { message: data.message || "An error occurred", code: data.code };
  } catch {
    return { message: `Request failed with status ${res.status}` };
  }
}

export function useItemsSearch(params: {
  q?: string;
  type?: string;
  folder?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [api.items.search.path, params],
    queryFn: async () => {
      const res = await fetch(api.items.search.path, {
        method: api.items.search.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: params.q ?? "",
          type: params.type ?? "all",
          folder: params.folder ?? undefined,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          includeDeleted: params.includeDeleted ?? false,
        }),
        credentials: "include",
      });

      if (res.status === 401) return null;
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }

      return api.items.search.responses[200].parse(await res.json());
    },
    retry: 1,
  });

  return query;
}

export function useItems() {
  // NOTE: existing behavior returns the full list for legacy dashboard/table usage.
  // Server-side filtering uses `useItemsSearch` above.


  // NOTE: existing behavior returns the full list for legacy dashboard/table usage.
  // Server-side filtering uses `useItemsSearch` below.

  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: [api.items.list.path],
    queryFn: async () => {
      if (!navigator.onLine) {
        throw new Error("Network unavailable. Please check your internet connection.");
      }
      const res = await fetch(api.items.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return api.items.list.responses[200].parse(await res.json());
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const trashedItemsQuery = useQuery({
    queryKey: ["/api/items/trash"],
    queryFn: async () => {
      const res = await fetch("/api/items/trash", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return res.json();
    },
  });

  const foldersQuery = useQuery({
    queryKey: ["/api/folders"],
    queryFn: async () => {
      const res = await fetch("/api/folders", { credentials: "include" });
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return res.json() as Promise<string[]>;
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.items.delete.path, { id });
      const res = await fetch(url, { method: api.items.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/trash"] });
    },
  });

  const trashItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/items/${id}/trash`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to trash item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/trash"] });
    },
  });

  const restoreItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/items/${id}/restore`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to restore item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/trash"] });
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      const res = await fetch(`/api/items/${id}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update tags");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, folder }: { id: number; folder: string }) => {
      const res = await fetch(`/api/items/${id}/folder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/items/${id}/favorite`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const url = buildUrl(api.items.delete.path, { id });
          const res = await fetch(url, { method: api.items.delete.method, credentials: "include" });
          return { id, success: res.ok };
        })
      );
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} item(s)`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/trash"] });
    },
  });

  const bulkFavoriteMutation = useMutation({
    mutationFn: async ({ ids, favorite }: { ids: number[]; favorite: boolean }) => {
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/items/${id}/favorite`, {
            method: "PATCH",
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to toggle favorite");
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });

  const uploadItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.items.upload.path, {
        method: api.items.upload.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      return api.items.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
    },
  });

  const exportCsvMutation = useMutation({
    mutationFn: async (payload: { q?: string; type?: string; folder?: string }) => {
      const res = await fetch(api.items.exportCsv.path, {
        method: api.items.exportCsv.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return res;
    },
  });

  const exportXlsxMutation = useMutation({
    mutationFn: async (payload: { q?: string; type?: string; folder?: string }) => {
      const res = await fetch(api.items.exportXlsx.path, {
        method: api.items.exportXlsx.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return res;
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async (payload: { q?: string; type?: string; folder?: string }) => {
      const res = await fetch(api.items.exportPdf.path, {
        method: api.items.exportPdf.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? {}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err.message);
      }
      return res;
    },
  });

  return {
    items: itemsQuery.data,
    trashedItems: trashedItemsQuery.data,
    folders: foldersQuery.data,
    isLoading: itemsQuery.isLoading,
    isError: itemsQuery.isError,
    deleteItem: deleteItemMutation.mutate,
    trashItem: trashItemMutation.mutate,
    restoreItem: restoreItemMutation.mutate,
    updateTags: updateTagsMutation.mutate,
    updateFolder: updateFolderMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
    bulkFavorite: bulkFavoriteMutation.mutate,
    isDeleting: deleteItemMutation.isPending,
    uploadItem: uploadItemMutation.mutateAsync,
    isUploading: uploadItemMutation.isPending,
    exportCsv: exportCsvMutation.mutateAsync,
    isExportingCsv: exportCsvMutation.isPending,

    exportXlsx: exportXlsxMutation.mutateAsync,
    isExportingXlsx: exportXlsxMutation.isPending,

    exportPdf: exportPdfMutation.mutateAsync,
    isExportingPdf: exportPdfMutation.isPending,
  };
}

export function useAccessItem() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.items.access.input>) => {
      const res = await fetch(api.items.access.path, {
        method: api.items.access.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Access denied" }));
        throw new Error(err.message || "Access denied");
      }
      return api.items.access.responses[200].parse(await res.json());
    },
  });
}
