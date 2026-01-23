"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use_toast";
import { Plus, Pencil, Loader2 } from "lucide-react";

const branch_schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type BranchFormData = z.infer<typeof branch_schema>;

/**
 * Admin branches management page
 * CRUD operations for branches with i18n support
 */
export default function AdminBranchesPage() {
  console.log("[AdminBranchesPage] Rendering");

  const utils = trpc.useUtils();
  const t = useTranslations("admin.branches_page");
  const [edit_branch, set_edit_branch] = useState<any>(null);
  const [dialog_open, set_dialog_open] = useState(false);

  const { data: branches, isLoading } = trpc.admin.list_branches.useQuery();

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branch_schema),
    defaultValues: {
      name: "",
      code: "",
      address: "",
      phone: "",
    },
  });

  const create_mutation = trpc.admin.create_branch.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.created") });
      close_dialog();
      utils.admin.list_branches.invalidate();
    },
    onError: (error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const update_mutation = trpc.admin.update_branch.useMutation({
    onSuccess: () => {
      toast({ title: t("toast.updated") });
      close_dialog();
      utils.admin.list_branches.invalidate();
    },
    onError: (error) => {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Open dialog for adding new branch
   * Resets form to empty state
   */
  function open_add_dialog() {
    console.log("[AdminBranchesPage] Opening add dialog");
    set_edit_branch(null);
    form.reset({
      name: "",
      code: "",
      address: "",
      phone: "",
    });
    set_dialog_open(true);
  }

  /**
   * Open dialog for editing existing branch
   * Pre-fills form with branch data
   * @param branch - Branch data to edit
   */
  function open_edit_dialog(branch: any) {
    console.log("[AdminBranchesPage] Opening edit dialog", { branch_id: branch.id });
    set_edit_branch(branch);
    form.reset({
      name: branch.name,
      code: branch.code || "",
      address: branch.address || "",
      phone: branch.phone || "",
    });
    set_dialog_open(true);
  }

  /**
   * Close dialog and reset state
   */
  function close_dialog() {
    console.log("[AdminBranchesPage] Closing dialog");
    set_dialog_open(false);
    set_edit_branch(null);
    form.reset();
  }

  /**
   * Handle form submission
   * Creates or updates branch based on edit state
   * @param data - Form data
   */
  function on_submit(data: BranchFormData) {
    console.log("[AdminBranchesPage] Submitting form", { is_edit: !!edit_branch });
    if (edit_branch) {
      update_mutation.mutate({
        id: edit_branch.id,
        ...data,
      });
    } else {
      create_mutation.mutate(data);
    }
  }

  const is_saving = create_mutation.isPending || update_mutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={open_add_dialog} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t("add_branch")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : branches && branches.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.code")}</TableHead>
                  <TableHead>{t("table.address")}</TableHead>
                  <TableHead>{t("table.phone")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.code || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {branch.address || "-"}
                    </TableCell>
                    <TableCell>{branch.phone || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          branch.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {branch.is_active ? t("active") : t("inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => open_edit_dialog(branch)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t("no_branches")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog_open} onOpenChange={set_dialog_open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit_branch ? t("dialog.edit_title") : t("dialog.add_title")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(on_submit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dialog.name_label")}</Label>
              <Input placeholder={t("dialog.name_placeholder")} {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("dialog.code_label")}</Label>
              <Input placeholder={t("dialog.code_placeholder")} {...form.register("code")} />
            </div>
            <div className="space-y-2">
              <Label>{t("dialog.address_label")}</Label>
              <Input
                placeholder={t("dialog.address_placeholder")}
                {...form.register("address")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dialog.phone_label")}</Label>
              <Input placeholder={t("dialog.phone_placeholder")} {...form.register("phone")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close_dialog}>
                {t("dialog.cancel")}
              </Button>
              <Button type="submit" disabled={is_saving}>
                {is_saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {edit_branch ? t("dialog.update") : t("dialog.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
