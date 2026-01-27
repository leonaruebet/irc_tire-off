"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use_toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, AlertTriangle, Copy, Download } from "lucide-react";

interface ParsedRecord {
  license_plate: string;
  phone: string;
  car_model?: string;
  branch_name: string;
  visit_date: Date;
  odometer_km?: number;
  total_price?: number;
  services_note?: string;
  tire_size?: string;
  tire_brand?: string;
  tire_model?: string;
  tire_position?: string;
  tire_production_week?: string;
  tire_price?: number;
  oil_model?: string;
  oil_viscosity?: string;
  oil_type?: string;
  engine_type?: string;
  oil_interval?: number;
}

// Column mapping from Thai headers
// Supports both tire-change ("เปลื่ยนยาง") and service ("เข้ารับบริการ") header variants
const COLUMN_MAP: Record<string, keyof ParsedRecord> = {
  // Core fields
  "ทะเบียนรถ": "license_plate",
  "เบอร์โทรศัพท์": "phone",
  "รถรุ่น": "car_model",
  // Branch variants
  "สาขาที่เปลื่ยนยาง": "branch_name",
  "สาขาที่เข้ารับบริการ": "branch_name",
  // Date variants
  "วันที่เปลื่ยนยาง": "visit_date",
  "วันที่เข้ารับบริการ": "visit_date",
  // Odometer variants (with and without กม. suffix)
  "ระยะที่เปลื่ยนยาง (กม.)": "odometer_km",
  "ระยะที่เข้ารับบริการ": "odometer_km",
  "ระยะที่เข้ารับบริการ (กม.)": "odometer_km",
  // Price & service note
  "ราคาทั้งหมด": "total_price",
  "บริการที่เข้ารับ": "services_note",
  // Tire fields
  "ไซส์ยาง": "tire_size",
  "ยี่ห้อ": "tire_brand",
  "รุ่นยาง": "tire_model",
  "ตำแหน่ง": "tire_position",
  "สัปดาห์ผลิต": "tire_production_week",
  "ราคาเส้นละ": "tire_price",
  // Oil fields
  "ชื่อรุ่น": "oil_model",
  "ความหนืด": "oil_viscosity",
  "เครื่องยนต์": "engine_type",
  "ประเภทน้ำมันเครื่อง": "oil_type",
  "ระยะเปลี่ยนถ่าย (กม.)": "oil_interval",
};

/**
 * Template headers for the downloadable Excel template.
 * Matches the standard Excel layout used by the business.
 * Sections: car info → tire change → service visit (x2) → pricing → oil change
 */
const TEMPLATE_HEADERS: string[] = [
  // Car info
  "ทะเบียนรถ",
  "เบอร์โทรศัพท์",
  "รถรุ่น",
  // Tire change section
  "วันที่เปลื่ยนยาง",
  "สาขาที่เปลื่ยนยาง",
  "ระยะที่เปลื่ยนยาง (กม.)",
  "ไซส์ยาง",
  "ยี่ห้อ",
  "รุ่นยาง",
  "สัปดาห์ผลิต",
  "ราคาเส้นละ",
  "ตำแหน่ง",
  // Service visit section 1
  "วันที่เข้ารับบริการ",
  "สาขาที่เข้ารับบริการ",
  "ระยะที่เข้ารับบริการ (กม.)",
  "บริการที่เข้ารับ",
  // Service visit section 2
  "วันที่เข้ารับบริการ",
  "สาขาที่เข้ารับบริการ",
  "ระยะที่เข้ารับบริการ (กม.)",
  "บริการที่เข้ารับ",
  // Pricing
  "ราคาทั้งหมด",
  // Oil change section
  "ชื่อรุ่น",
  "ความหนืด",
  "เครื่องยนต์",
  "ประเภทน้ำมันเครื่อง",
];

/**
 * Parse an Excel date value into a JavaScript Date.
 * Handles: serial numbers, DD/MM/YYYY strings, Buddhist Era (BE = CE + 543).
 * @param value - Raw cell value from Excel (number or string)
 * @returns Parsed Date object, or Invalid Date if unparseable
 */
function parse_excel_date(value: unknown): Date {
  // Excel serial number (most common)
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  const str = String(value).trim();

  // Try DD/MM/YYYY or D/M/YYYY (Thai date format, possibly Buddhist Era)
  const dmy_match = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy_match) {
    const day = parseInt(dmy_match[1], 10);
    const month = parseInt(dmy_match[2], 10);
    let year = parseInt(dmy_match[3], 10);

    // Convert Buddhist Era to CE (BE years are > 2400)
    if (year > 2400) {
      year -= 543;
    }

    // Handle 2-digit year
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    return new Date(year, month - 1, day);
  }

  // Fallback: try native Date parsing
  const fallback = new Date(str);
  return fallback;
}

/**
 * Generate and download an Excel template file with correct Thai headers.
 * Creates a .xlsx file client-side using the xlsx library.
 */
function download_template(): void {
  console.log("[AdminImportPage] Generating template file");
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);

  // Set column widths for readability
  worksheet["!cols"] = TEMPLATE_HEADERS.map((header) => ({
    wch: Math.max(header.length * 2, 16),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "import_template.xlsx");
  console.log("[AdminImportPage] Template file downloaded");
}

/**
 * Admin import page
 * Upload Excel/CSV files to bulk import service records
 * Supports i18n for Thai/English
 */
export default function AdminImportPage() {
  console.log("[AdminImportPage] Rendering");

  const utils = trpc.useUtils();
  const t = useTranslations("admin.import_page");
  const [parsed_data, set_parsed_data] = useState<ParsedRecord[]>([]);
  const [file_name, set_file_name] = useState<string>("");
  const [import_result, set_import_result] = useState<{
    success_count: number;
    duplicate_count: number;
    error_count: number;
    errors: string[];
  } | null>(null);

  const import_mutation = trpc.admin.import_records.useMutation({
    onSuccess: (result) => {
      console.log("[AdminImportPage] Import success", result);
      set_import_result(result);
      const duplicate_msg = result.duplicate_count > 0 ? `, ${result.duplicate_count} ${t("results.duplicates_skipped").toLowerCase()}` : "";
      toast({
        title: t("toast.completed"),
        description: t("toast.completed_desc", { success: result.success_count, errors: result.error_count }) + duplicate_msg,
      });
      utils.admin.list_visits.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (error) => {
      console.error("[AdminImportPage] Import error", error);
      toast({
        title: t("toast.failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle file drop
   * Parses Excel/CSV file and extracts records
   * @param accepted_files - Files dropped by user
   */
  const on_drop = useCallback((accepted_files: File[]) => {
    console.log("[AdminImportPage] File dropped");
    const file = accepted_files[0];
    if (!file) return;

    set_file_name(file.name);
    set_import_result(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet_name = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheet_name];
        const json_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (json_data.length < 2) {
          toast({
            title: t("toast.invalid_file"),
            description: t("toast.invalid_file_desc"),
            variant: "destructive",
          });
          return;
        }

        const headers = json_data[0] as string[];
        const records: ParsedRecord[] = [];

        // Track previous row's car info for carry-forward
        // Business Excel often only fills car info on the first row of a group
        let prev_car_info: { license_plate?: string; phone?: string; car_model?: string } = {};

        for (let i = 1; i < json_data.length; i++) {
          const row = json_data[i];
          if (!row || row.length === 0) continue;

          // Skip rows where ALL cells are empty
          const has_data = row.some((cell) => cell !== undefined && cell !== null && cell !== "");
          if (!has_data) continue;

          const record: any = {};

          headers.forEach((header, col_index) => {
            const field_name = COLUMN_MAP[header];
            if (field_name && row[col_index] !== undefined && row[col_index] !== null && row[col_index] !== "") {
              let value = row[col_index];

              // Handle phone: Excel stores as number, coerce to string with leading zero
              if (field_name === "phone") {
                value = String(value).trim();
                // Thai phones start with 0; Excel drops leading zero from numbers
                if (/^\d{9}$/.test(value)) {
                  value = "0" + value;
                }
              }

              // Handle date conversion
              if (field_name === "visit_date") {
                value = parse_excel_date(value);
              }

              // Handle number conversion
              if (
                ["odometer_km", "total_price", "tire_price", "oil_interval"].includes(
                  field_name
                )
              ) {
                value = Number(value) || 0;
              }

              // Handle string coercion for fields that may come as numbers
              if (
                ["license_plate", "tire_production_week", "tire_size"].includes(field_name) &&
                typeof value === "number"
              ) {
                value = String(value);
              }

              record[field_name] = value;
            }
          });

          // Carry-forward: inherit car info from previous row if missing
          if (!record.license_plate && prev_car_info.license_plate) {
            record.license_plate = prev_car_info.license_plate;
          }
          if (!record.phone && prev_car_info.phone) {
            record.phone = prev_car_info.phone;
          }
          if (!record.car_model && prev_car_info.car_model) {
            record.car_model = prev_car_info.car_model;
          }

          // Update carry-forward state when car info is present
          if (record.license_plate) {
            prev_car_info.license_plate = record.license_plate;
          }
          if (record.phone) {
            prev_car_info.phone = record.phone;
          }
          if (record.car_model) {
            prev_car_info.car_model = record.car_model;
          }

          // Validate: require car identity + at least one date
          // Row must have car info and a parseable date to be valid
          if (
            record.license_plate &&
            record.phone &&
            record.visit_date &&
            record.visit_date instanceof Date &&
            !isNaN(record.visit_date.getTime())
          ) {
            // If branch_name is missing, use a default placeholder
            if (!record.branch_name) {
              record.branch_name = "-";
            }
            records.push(record as ParsedRecord);
          }
        }

        set_parsed_data(records);
        toast({
          title: t("toast.parsed"),
          description: t("toast.parsed_desc", { count: records.length }),
        });
      } catch (error) {
        console.error("[AdminImportPage] Error parsing file:", error);
        toast({
          title: t("toast.parse_error"),
          description: t("toast.parse_error_desc"),
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: on_drop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  /**
   * Handle import button click
   * Triggers import mutation
   */
  function handle_import() {
    console.log("[AdminImportPage] Starting import");
    if (parsed_data.length === 0) return;
    import_mutation.mutate({ records: parsed_data });
  }

  /**
   * Reset import state
   * Clears parsed data and results
   */
  function reset_import() {
    console.log("[AdminImportPage] Resetting import");
    set_parsed_data([]);
    set_file_name("");
    set_import_result(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle>{t("upload_title")}</CardTitle>
          <CardDescription>
            {t("upload_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={download_template}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t("download_template")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("download_template_desc")}
          </p>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg">{t("drop_here")}</p>
            ) : (
              <>
                <p className="text-lg mb-2">{t("drag_drop")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("supported_files")}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed data preview */}
      {parsed_data.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="truncate">{file_name}</CardTitle>
                  <CardDescription>{t("records_ready", { count: parsed_data.length })}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={reset_import} className="flex-1 sm:flex-initial">
                  {t("clear")}
                </Button>
                <Button onClick={handle_import} disabled={import_mutation.isPending} className="flex-1 sm:flex-initial">
                  {import_mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("import_records")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="max-h-[400px] overflow-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.row_num")}</TableHead>
                    <TableHead>{t("table.license_plate")}</TableHead>
                    <TableHead>{t("table.phone")}</TableHead>
                    <TableHead>{t("table.branch")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.odometer")}</TableHead>
                    <TableHead>{t("table.tire")}</TableHead>
                    <TableHead>{t("table.oil")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed_data.slice(0, 50).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{record.license_plate}</TableCell>
                      <TableCell>{record.phone}</TableCell>
                      <TableCell>{record.branch_name}</TableCell>
                      <TableCell>
                        {record.visit_date instanceof Date
                          ? record.visit_date.toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{record.odometer_km?.toLocaleString() || "-"}</TableCell>
                      <TableCell>
                        {record.tire_size ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {record.tire_position || "?"}: {record.tire_size}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {record.oil_viscosity ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                            {record.oil_viscosity}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsed_data.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("showing_first", { count: 50, total: parsed_data.length })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import result */}
      {import_result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {import_result.error_count === 0 && import_result.success_count > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : import_result.error_count === 0 && import_result.duplicate_count > 0 ? (
                <Copy className="h-5 w-5 text-yellow-500" />
              ) : import_result.success_count > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {t("results.title")}
            </CardTitle>
            {import_result.duplicate_count > 0 && import_result.error_count === 0 && (
              <CardDescription className="text-yellow-600">
                {t("results.duplicates_note", { count: import_result.duplicate_count })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-green-50 text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-2xl font-bold">{import_result.success_count}</p>
                </div>
                <p className="text-sm">{t("results.records_imported")}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 text-yellow-700">
                <div className="flex items-center gap-2">
                  <Copy className="h-5 w-5 flex-shrink-0" />
                  <p className="text-2xl font-bold">{import_result.duplicate_count}</p>
                </div>
                <p className="text-sm">{t("results.duplicates_skipped")}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 text-red-700">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-2xl font-bold">{import_result.error_count}</p>
                </div>
                <p className="text-sm">{t("results.errors")}</p>
              </div>
            </div>
            {import_result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">{t("results.errors_list")}</p>
                <div className="bg-muted rounded-lg p-3 max-h-[200px] overflow-auto text-sm">
                  {import_result.errors.map((error, i) => (
                    <p key={i} className="text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Column mapping reference */}
      <Card>
        <CardHeader>
          <CardTitle>{t("columns.title")}</CardTitle>
          <CardDescription>
            {t("columns.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.keys(COLUMN_MAP).map((header) => (
              <div key={header} className="p-2 bg-muted rounded">
                {header}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
