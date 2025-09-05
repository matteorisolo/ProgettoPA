import PDFDocument from "pdfkit";
import Product from "../models/product";
import { IPurchaseDetailsDTO } from "../repositories/purchaseRepository";
import { PurchaseType } from "../enums/PurchaseType";

interface IGroupedPurchases {
    standard: IPurchaseDetailsDTO[];
    gift: IPurchaseDetailsDTO[];
    additional_download: IPurchaseDetailsDTO[];
}

export const generatePDF = (
    userId: number,
    groupedPurchases: IGroupedPurchases
) => {
    return new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);

        // Title
        doc.fontSize(20).text(`Purchase history for user ID: ${userId}`, {
        align: "center",
        });
        doc.moveDown(2);

        // ---------- Standard purchases ----------
        doc.fontSize(16).fillColor("black").text("Original downloads", { underline: true });
        doc.moveDown(0.5);

        if (groupedPurchases.standard.length === 0) {
            doc.fontSize(12).fillColor("gray").text("No standard purchases.");
        } else {
            groupedPurchases.standard.forEach((p) => {
                const product = p.product as Product | undefined;
                doc.fontSize(12).fillColor("black").text(
                `• Product: ${product?.title ?? "N/A"} | Format: ${product?.format ?? "N/A"} | Year: ${product?.year ?? "N/A"}`
                );
            });
        }
        doc.moveDown();

        // ---------- Gift purchases ----------
        doc.fontSize(16).fillColor("black").text("Gifts", { underline: true });
        doc.moveDown(0.5);

        if (groupedPurchases.gift.length === 0) {
            doc.fontSize(12).fillColor("gray").text("No gifts.");
        } else {
            groupedPurchases.gift.forEach((p) => {
                const product = p.product as Product | undefined;
                doc.fontSize(12).fillColor("black").text(
                `• Product: ${product?.title ?? "N/A"} | Format: ${product?.format ?? "N/A"} | Year: ${product?.year ?? "N/A"}`
                );
                if (p.type === PurchaseType.GIFT && p.recipient) {
                const recName = `${p.recipient.firstName ?? ""} ${p.recipient.lastName ?? ""}`.trim();
                const recDisplay = recName || p.recipient.email || "recipient";
                doc.fontSize(11).fillColor("blue").text(`   → Gifted to: ${recDisplay}`);
                }
            });
        }
        doc.moveDown();

        // ---------- Additional downloads ----------
        doc.fontSize(16).fillColor("black").text("Extra downloads", { underline: true });
        doc.moveDown(0.5);

        if (groupedPurchases.additional_download.length === 0) {
            doc.fontSize(12).fillColor("gray").text("No extra downloads.");
        } else {
            groupedPurchases.additional_download.forEach((p) => {
                const product = p.product as Product | undefined;
                doc.fontSize(12).fillColor("black").text(
                `• Product: ${product?.title ?? "N/A"} | Format: ${product?.format ?? "N/A"} | Year: ${product?.year ?? "N/A"}`
                );
            });
        }
        doc.moveDown();

        // Close doc
        doc.end();
    });
};