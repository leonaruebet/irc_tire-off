"use client";

import { useState, useCallback, useMemo } from "react";
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
  oil_price?: number;
}

/**
 * Section types for column mapping.
 * Each Excel row belongs to exactly one section (mutually exclusive).
 * - tire_change: 4 rows per set (FL/FR/RL/RR), each row = 1 tire position
 * - tire_switch: 1 row per event (e.g. "สลับยาง-ถ่วงล้อ")
 * - oil_change: 1 row per event (e.g. "ถ่ายน้ำมันเครื่อง")
 */
type SectionType = "car_info" | "tire_change" | "tire_switch" | "oil_change";

/**
 * Resolved column mapping entry: tells the parser which ParsedRecord field
 * to assign and which section the column belongs to.
 */
interface ColumnMapping {
  field: keyof ParsedRecord;
  section: SectionType;
}

/**
 * Car info columns — shared across all row types.
 * Maps Thai header text → ParsedRecord field name.
 */
const CAR_INFO_MAP: Record<string, keyof ParsedRecord> = {
  "ทะเบียนรถ": "license_plate",
  "เบอร์โทรศัพท์": "phone",
  "รถรุ่น": "car_model",
  "ยี่ห้อรถ": "car_model",
};

/**
 * Section-specific columns with UNIQUE header names.
 * These headers appear only once in any Excel layout and
 * unambiguously identify which section they belong to.
 * Maps Thai header text → { section, field }.
 */
const SECTION_COLUMN_MAP: Record<string, { section: SectionType; field: keyof ParsedRecord }> = {
  // ── Tire Change: unique date/branch/odo headers ──
  "วันที่เปลื่ยนยาง":          { section: "tire_change", field: "visit_date" },
  "สาขาที่เปลื่ยนยาง":         { section: "tire_change", field: "branch_name" },
  "ระยะที่เปลื่ยนยาง (กม.)":   { section: "tire_change", field: "odometer_km" },
  "ไซส์ยาง":                   { section: "tire_change", field: "tire_size" },
  "ยี่ห้อ":                    { section: "tire_change", field: "tire_brand" },
  "รุ่นยาง":                   { section: "tire_change", field: "tire_model" },
  "สัปดาห์ผลิต":               { section: "tire_change", field: "tire_production_week" },
  "ราคาเส้นละ":                { section: "tire_change", field: "tire_price" },
  "ตำแหน่ง":                   { section: "tire_change", field: "tire_position" },

  // ── Tire Switch: unique date/branch/odo headers (with Thai spelling variants) ──
  "วันที่สลับยาง":             { section: "tire_switch", field: "visit_date" },
  "สาขาที่สลับยาง":            { section: "tire_switch", field: "branch_name" },
  "ระยะสลับยาง":               { section: "tire_switch", field: "odometer_km" },
  "ระยะสลับยาง (กม.)":         { section: "tire_switch", field: "odometer_km" },
  "ระยะที่สลับยาง":            { section: "tire_switch", field: "odometer_km" },
  "ระยะที่สลับยาง (กม.)":      { section: "tire_switch", field: "odometer_km" },
  "บริการ":                    { section: "tire_switch", field: "services_note" },

  // ── Oil Change: unique date/branch/odo headers ──
  "วันที่เปลี่ยนน้ำมันเครื่อง":    { section: "oil_change", field: "visit_date" },
  "วันที่เปลี่ยนน้ำมัน":          { section: "oil_change", field: "visit_date" },
  "วันที่เปลี่ยนถ่าย":           { section: "oil_change", field: "visit_date" },
  "วันที่ถ่ายน้ำมันเครื่อง":      { section: "oil_change", field: "visit_date" },
  "วันที่ถ่ายน้ำมัน":            { section: "oil_change", field: "visit_date" },
  "สาขาที่เปลี่ยนน้ำมันเครื่อง":   { section: "oil_change", field: "branch_name" },
  "สาขาที่เปลี่ยนน้ำมัน":         { section: "oil_change", field: "branch_name" },
  "สาขาที่เปลี่ยนถ่าย":          { section: "oil_change", field: "branch_name" },
  "สาขาที่ถ่ายน้ำมันเครื่อง":     { section: "oil_change", field: "branch_name" },
  "สาขาที่ถ่ายน้ำมัน":           { section: "oil_change", field: "branch_name" },
  "ระยะเปลี่ยนน้ำมันเครื่อง (กม.)":  { section: "oil_change", field: "odometer_km" },
  "ระยะเปลี่ยนน้ำมันเครื่อง":      { section: "oil_change", field: "odometer_km" },
  "ระยะที่เปลี่ยนน้ำมันเครื่อง (กม.)": { section: "oil_change", field: "odometer_km" },
  "ระยะที่เปลี่ยนน้ำมันเครื่อง":    { section: "oil_change", field: "odometer_km" },
  "ระยะเปลี่ยนน้ำมัน (กม.)":       { section: "oil_change", field: "odometer_km" },
  "ระยะเปลี่ยนน้ำมัน":             { section: "oil_change", field: "odometer_km" },
  "ระยะถ่ายน้ำมันเครื่อง (กม.)":    { section: "oil_change", field: "odometer_km" },
  "ระยะถ่ายน้ำมันเครื่อง":          { section: "oil_change", field: "odometer_km" },
  "ระยะที่ถ่ายน้ำมันเครื่อง (กม.)":  { section: "oil_change", field: "odometer_km" },
  "ระยะที่ถ่ายน้ำมันเครื่อง":       { section: "oil_change", field: "odometer_km" },
  "ระยะถ่ายน้ำมัน (กม.)":          { section: "oil_change", field: "odometer_km" },
  "ระยะถ่ายน้ำมัน":                { section: "oil_change", field: "odometer_km" },
  "ราคาทั้งหมด":                  { section: "oil_change", field: "total_price" },
  "ชื่อรุ่น":                     { section: "oil_change", field: "oil_model" },
  "ความหนืด":                     { section: "oil_change", field: "oil_viscosity" },
  "เครื่องยนต์":                   { section: "oil_change", field: "engine_type" },
  "ประเภทน้ำมันเครื่อง":           { section: "oil_change", field: "oil_type" },
  "ระยะเปลี่ยนถ่าย (กม.)":         { section: "oil_change", field: "oil_interval" },
  "ราคาน้ำมัน":                    { section: "oil_change", field: "oil_price" },
};

/**
 * Generic (ambiguous) headers that appear multiple times in the client's
 * original Excel file. The occurrence order (left-to-right) determines
 * which section each instance belongs to.
 *
 * Client layout: cols 12-15 = tire_switch (1st occurrence),
 *                cols 16-19 = oil_change (2nd occurrence).
 *
 * Each entry maps header text → [field, [section_for_1st, section_for_2nd, ...]].
 */
const GENERIC_HEADER_SECTIONS: Record<string, { field: keyof ParsedRecord; sections: SectionType[] }> = {
  "วันที่เข้ารับบริการ":          { field: "visit_date",    sections: ["tire_switch", "oil_change"] },
  "สาขาที่เข้ารับบริการ":         { field: "branch_name",   sections: ["tire_switch", "oil_change"] },
  "ระยะที่เข้ารับบริการ":         { field: "odometer_km",   sections: ["tire_switch", "oil_change"] },
  "ระยะที่เข้ารับบริการ (กม.)":   { field: "odometer_km",   sections: ["tire_switch", "oil_change"] },
  "บริการที่เข้ารับ":             { field: "services_note", sections: ["tire_switch", "oil_change"] },
};

/**
 * Build a column map for a specific sheet's headers.
 * Runs once per sheet. Returns a Map<col_index, ColumnMapping>.
 *
 * Resolution order:
 *   1. CAR_INFO_MAP → car_info section
 *   2. SECTION_COLUMN_MAP → uniquely-named section columns
 *   3. GENERIC_HEADER_SECTIONS → occurrence-based (1st = tire_switch, 2nd = oil_change)
 *   4. Unknown headers (ผู้กรอก, LOGIC, etc.) → silently skipped
 *
 * @param headers - Array of Thai header strings from the sheet's first row
 * @returns Map from column index to { field, section }
 */
function build_column_map(headers: string[]): Map<number, ColumnMapping> {
  console.log("[build_column_map] Building map for headers:", headers.length);
  const col_map = new Map<number, ColumnMapping>();
  const occurrence_count: Record<string, number> = {};

  for (let col = 0; col < headers.length; col++) {
    const header = String(headers[col] ?? "").trim();
    if (!header) continue;

    // 1. Check car info
    const car_field = CAR_INFO_MAP[header];
    if (car_field) {
      col_map.set(col, { field: car_field, section: "car_info" });
      continue;
    }

    // 2. Check unique section columns
    const section_entry = SECTION_COLUMN_MAP[header];
    if (section_entry) {
      col_map.set(col, { field: section_entry.field, section: section_entry.section });
      continue;
    }

    // 3. Check generic/duplicate headers (occurrence-based)
    const generic_entry = GENERIC_HEADER_SECTIONS[header];
    if (generic_entry) {
      const count = occurrence_count[header] ?? 0;
      occurrence_count[header] = count + 1;
      const section = generic_entry.sections[count] ?? generic_entry.sections[generic_entry.sections.length - 1];
      col_map.set(col, { field: generic_entry.field, section });
      continue;
    }

    // 4. Unknown header → skip silently
    console.log("[build_column_map] Skipping unknown header:", header, "at col:", col);
  }

  console.log("[build_column_map] Mapped", col_map.size, "of", headers.length, "columns");
  return col_map;
}

/**
 * Service type categories used for preview filtering.
 * Detected post-parse based on which fields are populated.
 */
type ServiceType = "tire_change" | "tire_switch" | "oil_change";

/**
 * Preview filter options: show all or a specific service type.
 */
type PreviewFilter = "all" | ServiceType;

/**
 * Detect which service type(s) a parsed row belongs to.
 * Based on which section-specific fields are populated (non-empty).
 * @param record - A parsed Excel row
 * @returns Array of detected service types (may contain multiple for combined rows)
 */
function detect_service_types(record: ParsedRecord): ServiceType[] {
  const types: ServiceType[] = [];

  // Tire change: has tire-specific fields
  if (record.tire_size || record.tire_brand || record.tire_model) {
    types.push("tire_change");
  }

  // Oil change: has oil-specific fields
  if (record.oil_model || record.oil_viscosity || record.oil_type) {
    types.push("oil_change");
  }

  // Tire switch / service visit: has services_note but no tire or oil data
  if (record.services_note && types.length === 0) {
    types.push("tire_switch");
  }

  return types;
}

/**
 * Map service type to display color classes for preview badges.
 * @param type - The service type
 * @returns Tailwind CSS class string for badge styling
 */
function service_type_badge_classes(type: ServiceType): string {
  switch (type) {
    case "tire_change":
      return "bg-blue-100 text-blue-700";
    case "oil_change":
      return "bg-amber-100 text-amber-700";
    case "tire_switch":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Template headers for the downloadable Excel template (single sheet, 26 columns).
 * Each section has its OWN date/branch/odometer columns with unique header names.
 * Sections are mutually exclusive per row:
 *
 * - Tire change rows: fill car info + tire change section (1 row per tire position FL/FR/RL/RR)
 * - Tire switch rows: fill car info + tire switch section (1 row per event)
 * - Oil change rows:  fill car info + oil change section (1 row per event)
 */
const TEMPLATE_HEADERS: string[] = [
  // ── Car Info (cols 0-2) ──
  "ทะเบียนรถ",
  "เบอร์โทรศัพท์",
  "รถรุ่น",
  // ── Tire Change (cols 3-11) — date/branch/odo specific to tire change ──
  "วันที่เปลื่ยนยาง",
  "สาขาที่เปลื่ยนยาง",
  "ระยะที่เปลื่ยนยาง (กม.)",
  "ไซส์ยาง",
  "ยี่ห้อ",
  "รุ่นยาง",
  "สัปดาห์ผลิต",
  "ราคาเส้นละ",
  "ตำแหน่ง",
  // ── Tire Switch (cols 12-15) — date/branch/odo specific to tire switch ──
  "วันที่สลับยาง",
  "สาขาที่สลับยาง",
  "ระยะสลับยาง (กม.)",
  "บริการ",
  // ── Oil Change (cols 16-25) — date/branch/odo specific to oil change ──
  "วันที่เปลี่ยนน้ำมันเครื่อง",
  "สาขาที่เปลี่ยนน้ำมันเครื่อง",
  "ระยะเปลี่ยนน้ำมันเครื่อง (กม.)",
  "ราคาทั้งหมด",
  "ชื่อรุ่น",
  "ความหนืด",
  "เครื่องยนต์",
  "ประเภทน้ำมันเครื่อง",
  "ระยะเปลี่ยนถ่าย (กม.)",
  "ราคาน้ำมัน",
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
    let year = parsed.y;

    // Excel returns Buddhist Era (BE) year for Thai dates (e.g., 2568)
    // Convert to CE for storage, then format_date will add 543 back for display
    if (year > 2400) {
      year -= 543;
    }

    // Use UTC to avoid timezone issues - creates date at UTC midnight
    return new Date(Date.UTC(year, parsed.m - 1, parsed.d));
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
    // In Thai context: >= 50 are likely Buddhist Era short form (e.g., "67" = BE 2567 = CE 2024)
    // < 50 are CE (e.g., "24" = CE 2024)
    if (year < 100) {
      year += year < 50 ? 2000 : 1957;
    }

    // Use UTC to avoid timezone issues - creates date at UTC midnight
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Fallback: try native Date parsing
  const fallback = new Date(str);

  // Check if fallback year is Buddhist Era (e.g., ISO string "2567-01-15")
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 2400) {
    console.log("[parse_excel_date] Converting fallback BE year", {
      be: fallback.getFullYear(),
      ce: fallback.getFullYear() - 543,
    });
    fallback.setFullYear(fallback.getFullYear() - 543);
  }

  return fallback;
}

/**
 * Generate and download an Excel template file with correct Thai headers.
 * Single sheet with all columns for tire change, oil change, and tire switch.
 * @returns void
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

  const [preview_filter, set_preview_filter] = useState<PreviewFilter>("all");

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
   * Count records by service type for filter tab badges.
   * Memoized to avoid recalculating on every render.
   */
  const type_counts = useMemo(() => {
    console.log("[AdminImportPage] Computing type counts");
    const counts = { tire_change: 0, tire_switch: 0, oil_change: 0 };
    parsed_data.forEach((record) => {
      const types = detect_service_types(record);
      types.forEach((st) => { counts[st]++; });
    });
    return counts;
  }, [parsed_data]);

  /**
   * Filtered records based on current preview filter selection.
   * When filter is "all", returns all parsed data.
   * Otherwise filters to records that include the selected service type.
   */
  const filtered_data = useMemo(() => {
    console.log("[AdminImportPage] Filtering data for:", preview_filter);
    if (preview_filter === "all") return parsed_data;
    return parsed_data.filter((record) =>
      detect_service_types(record).includes(preview_filter)
    );
  }, [parsed_data, preview_filter]);

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

        // Process ALL sheets in the workbook (supports multi-sheet templates)
        const all_records: ParsedRecord[] = [];

        for (const sheet_name of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheet_name];
          const json_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          // Skip sheets with no data rows (header only or empty)
          if (json_data.length < 2) {
            console.log("[AdminImportPage] Skipping empty sheet:", sheet_name);
            continue;
          }

          console.log("[AdminImportPage] Processing sheet:", sheet_name, "rows:", json_data.length - 1);

          const headers = json_data[0] as string[];

          // Build section-aware column map for this sheet's headers
          const col_map = build_column_map(headers);

          // Track previous row's car info for carry-forward (per sheet)
          // Business Excel often only fills car info on the first row of a group
          let prev_car_info: { license_plate?: string; phone?: string; car_model?: string } = {};

          for (let i = 1; i < json_data.length; i++) {
            const row = json_data[i];
            if (!row || row.length === 0) continue;

            // Skip rows where ALL cells are empty
            const has_data = row.some((cell) => cell !== undefined && cell !== null && cell !== "");
            if (!has_data) continue;

            // Parse cells into section buckets first, then merge into record
            const record: any = {};
            // Track which sections have data in this row
            const section_dates: Partial<Record<SectionType, Date>> = {};
            const section_branches: Partial<Record<SectionType, string>> = {};
            const section_odometers: Partial<Record<SectionType, number>> = {};

            col_map.forEach((mapping, col_index) => {
              const cell = row[col_index];
              if (cell === undefined || cell === null || cell === "") return;

              const { field, section } = mapping;
              let value: any = cell;

              // Handle phone: Excel stores as number, coerce to string with leading zero
              if (field === "phone") {
                value = String(value).trim();
                // Thai phones start with 0; Excel drops leading zero from numbers
                if (/^\d{9}$/.test(value)) {
                  value = "0" + value;
                }
              }

              // Handle date conversion — store per-section for later resolution
              if (field === "visit_date") {
                const parsed_date = parse_excel_date(value);
                if (parsed_date instanceof Date && !isNaN(parsed_date.getTime())) {
                  section_dates[section] = parsed_date;
                }
                return; // Don't assign to record yet
              }

              // Handle branch — store per-section
              if (field === "branch_name") {
                section_branches[section] = String(value).trim();
                return;
              }

              // Handle odometer — store per-section
              if (field === "odometer_km") {
                section_odometers[section] = Number(value) || 0;
                return;
              }

              // Handle number conversion for other numeric fields
              if (
                ["total_price", "tire_price", "oil_interval", "oil_price"].includes(field)
              ) {
                value = Number(value) || 0;
              }

              // Handle string coercion for fields that may come as numbers
              if (
                ["license_plate", "tire_production_week", "tire_size"].includes(field) &&
                typeof value === "number"
              ) {
                value = String(value);
              }

              record[field] = value;
            });

            // Determine which section this row belongs to (mutually exclusive)
            // Priority: tire_change (has tire fields) > oil_change (has oil fields) > tire_switch (services_note only)
            // Oil rows in client's Excel also have services_note (col 19 "บริการที่เข้ารับ" = "ถ่ายน้ำมันเครื่อง"),
            // so oil fields MUST be checked before services_note to avoid misclassifying oil rows as tire_switch.
            let active_section: SectionType = "tire_change";
            if (record.tire_size || record.tire_brand || record.tire_model || record.tire_position) {
              active_section = "tire_change";
            } else if (record.oil_model || record.oil_viscosity || record.oil_type || record.total_price) {
              active_section = "oil_change";
            } else if (record.services_note) {
              active_section = "tire_switch";
            } else {
              // Fallback: use whichever section has a date
              if (section_dates.tire_change) active_section = "tire_change";
              else if (section_dates.tire_switch) active_section = "tire_switch";
              else if (section_dates.oil_change) active_section = "oil_change";
            }

            // Resolve date: prefer the active section's date, fall back to any available date
            record.visit_date =
              section_dates[active_section] ??
              section_dates.tire_change ??
              section_dates.tire_switch ??
              section_dates.oil_change;

            // Resolve branch: prefer the active section's branch, fall back to any
            record.branch_name =
              section_branches[active_section] ??
              section_branches.tire_change ??
              section_branches.tire_switch ??
              section_branches.oil_change;

            // Resolve odometer: prefer the active section's odometer, fall back to any
            record.odometer_km =
              section_odometers[active_section] ??
              section_odometers.tire_change ??
              section_odometers.tire_switch ??
              section_odometers.oil_change;

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
              all_records.push(record as ParsedRecord);
            }
          }
        }

        if (all_records.length === 0) {
          toast({
            title: t("toast.invalid_file"),
            description: t("toast.invalid_file_desc"),
            variant: "destructive",
          });
          return;
        }

        set_parsed_data(all_records);
        toast({
          title: t("toast.parsed"),
          description: t("toast.parsed_desc", { count: all_records.length }),
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
    set_preview_filter("all");
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
          <CardContent className="p-0 sm:p-6 space-y-4">
            {/* Service type filter tabs */}
            <div className="flex flex-wrap gap-2 px-4 sm:px-0">
              <Button
                size="sm"
                variant={preview_filter === "all" ? "default" : "outline"}
                onClick={() => set_preview_filter("all")}
              >
                {t("filter.all")} ({parsed_data.length})
              </Button>
              <Button
                size="sm"
                variant={preview_filter === "tire_change" ? "default" : "outline"}
                onClick={() => set_preview_filter("tire_change")}
                className={preview_filter === "tire_change" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                {t("filter.tire_change")} ({type_counts.tire_change})
              </Button>
              <Button
                size="sm"
                variant={preview_filter === "tire_switch" ? "default" : "outline"}
                onClick={() => set_preview_filter("tire_switch")}
                className={preview_filter === "tire_switch" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                {t("filter.tire_switch")} ({type_counts.tire_switch})
              </Button>
              <Button
                size="sm"
                variant={preview_filter === "oil_change" ? "default" : "outline"}
                onClick={() => set_preview_filter("oil_change")}
                className={preview_filter === "oil_change" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                {t("filter.oil_change")} ({type_counts.oil_change})
              </Button>
            </div>

            {/* Preview table */}
            <div className="max-h-[400px] overflow-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.row_num")}</TableHead>
                    <TableHead>{t("table.type")}</TableHead>
                    <TableHead>{t("table.license_plate")}</TableHead>
                    <TableHead>{t("table.phone")}</TableHead>
                    <TableHead>{t("table.branch")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.odometer")}</TableHead>
                    <TableHead>{t("table.tire")}</TableHead>
                    <TableHead>{t("table.oil")}</TableHead>
                    <TableHead>{t("table.note")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered_data.slice(0, 50).map((record, index) => {
                    const types = detect_service_types(record);
                    return (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {types.map((st) => (
                              <span
                                key={st}
                                className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${service_type_badge_classes(st)}`}
                              >
                                {t(`filter.${st}`)}
                              </span>
                            ))}
                            {types.length === 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
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
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                              {record.oil_viscosity}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {record.services_note ? (
                            <span className="text-xs text-muted-foreground">
                              {record.services_note}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered_data.length > 50 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("showing_first", { count: 50, total: filtered_data.length })}
                </p>
              )}
              {filtered_data.length === 0 && preview_filter !== "all" && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t("filter.no_records")}
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

      {/* Column mapping reference — grouped by section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("columns.title")}</CardTitle>
          <CardDescription>
            {t("columns.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Car Info */}
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Car Info</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.keys(CAR_INFO_MAP).map((header) => (
                <div key={header} className="p-2 bg-muted rounded">{header}</div>
              ))}
            </div>
          </div>
          {/* Tire Change */}
          <div>
            <p className="text-sm font-medium mb-2 text-blue-600">Tire Change</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(SECTION_COLUMN_MAP)
                .filter(([, v]) => v.section === "tire_change")
                .map(([header]) => (
                  <div key={header} className="p-2 bg-blue-50 rounded">{header}</div>
                ))}
            </div>
          </div>
          {/* Tire Switch */}
          <div>
            <p className="text-sm font-medium mb-2 text-green-600">Tire Switch</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(SECTION_COLUMN_MAP)
                .filter(([, v]) => v.section === "tire_switch")
                .map(([header]) => (
                  <div key={header} className="p-2 bg-green-50 rounded">{header}</div>
                ))}
              {Object.keys(GENERIC_HEADER_SECTIONS).map((header) => (
                <div key={`gen-${header}`} className="p-2 bg-green-50/50 rounded border border-dashed border-green-200 text-muted-foreground">{header}</div>
              ))}
            </div>
          </div>
          {/* Oil Change */}
          <div>
            <p className="text-sm font-medium mb-2 text-amber-600">Oil Change</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(SECTION_COLUMN_MAP)
                .filter(([, v]) => v.section === "oil_change")
                .map(([header]) => (
                  <div key={header} className="p-2 bg-amber-50 rounded">{header}</div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
