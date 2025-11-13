// utils/getUnifiedLines.ts
export function getUnifiedLines(
  tx: any,
  serviceNameById?: Map<string, string> | null 
) {
  const out: Array<{
    itemType: "product" | "service";
    name: string;
    description?: string;
    quantity?: number;
    unit?: string;
    pricePerUnit?: number;
    amount: number;
    gstPercentage?: number;
    lineTax?: number;
    lineTotal?: number;
    code?: string;
  }> = [];

  const num = (n: any, d = 0) => {
    if (n == null || n === "") return d;
    const parsed = Number(n);
    return isNaN(parsed) ? d : parsed;
  };

  const pushRow = (row: any, itemType: "product" | "service") => {
    const isService = itemType === "service";

    // Name fallbacks for products and services:
    const name =
      row.name ??
      row.productName ??
      (row.product && typeof row.product === "object" ? row.product.name : undefined) ??
      (isService
        ? row.serviceName ??
          (row.service && typeof row.service === "object"
            ? row.service.serviceName
            : undefined) ??
          (row.service ? serviceNameById?.get(String(row.service)) : undefined)
        : undefined) ??
      "Item";

    const quantity = isService ? 1 : num(row.quantity, 1);
    const amount = num(row.amount) || num(row.pricePerUnit) * quantity;
    const pricePerUnit = num(row.pricePerUnit) || (quantity > 0 ? amount / quantity : 0);

    // FIX: Handle unitType and otherUnit properly
    let unit = "piece"; // default fallback
    
    if (row.unitType === 'Other' && row.otherUnit) {
      // If unitType is "Other", use otherUnit value
      unit = row.otherUnit;
    } else if (row.unitType) {
      // If unitType has a value and it's not "Other", use unitType
      unit = row.unitType;
    } else if (row.unit) {
      // Fallback to unit if unitType is not available
      unit = row.unit;
    } else if (row.unitName) {
      // Fallback to unitName
      unit = row.unitName;
    }

    // Extract GST information
    const gstPercentage = num(row.gstPercentage);
    const lineTax = num(row.lineTax);
    const lineTotal = num(row.lineTotal) || amount + lineTax;

    out.push({
      itemType,
      name,
      description: row.description || "",
      quantity,
      unit, // This will now correctly show "ft" for sand instead of "piece"
      pricePerUnit,
      amount,
      gstPercentage: gstPercentage > 0 ? gstPercentage : undefined,
      lineTax: lineTax > 0 ? lineTax : undefined,
      lineTotal: lineTotal > 0 ? lineTotal : amount,
      code: isService ? row.sac : row.hsn
    });
  };

  // Process products
  if (Array.isArray(tx.products)) {
    tx.products.forEach((p: any) => pushRow(p, "product"));
  }

  // Process services
  if (Array.isArray(tx.services)) {
    tx.services.forEach((s: any) => pushRow(s, "service"));
  }

  // Legacy support
  if (Array.isArray(tx.service)) {
    tx.service.forEach((s: any) => pushRow(s, "service"));
  }

  // If no items found, create a default item from transaction level data
  if (out.length === 0) {
    const amount = num(tx.amount);
    const gstPercentage = num(tx.gstPercentage);
    const lineTax = num(tx.lineTax) || (amount * gstPercentage) / 100;
    const lineTotal = num(tx.totalAmount) || amount + lineTax;

    out.push({
      itemType: "service",
      name: tx.description || "Item",
      description: "",
      quantity: 1,
      pricePerUnit: amount,
      amount,
      gstPercentage: gstPercentage > 0 ? gstPercentage : undefined,
      lineTax: lineTax > 0 ? lineTax : undefined,
      lineTotal,
      code: undefined
    });
  }

  return out;
}