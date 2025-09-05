import PDFDocument from "pdfkit";
import Purchase from "../models/purchase";
import Product from "../models/product";

interface GroupedPurchases {
    [key: string]: (Purchase & { product?: Product })[];
}

export const generatePDF = (
    userId: number,
    groupedPurchases: GroupedPurchases
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

    // Iterate purchase groups (standard, gift, additional_download))
    for (const [type, purchases] of Object.entries(groupedPurchases)) {
        doc
            .fontSize(16)
            .fillColor("black")
            .text(`Purchase type: ${type}`, { underline: true });
        doc.moveDown(0.5);

        if (purchases.length === 0) {
            doc.fontSize(12).fillColor("gray").text("No purchase in this category.");
            doc.moveDown();
            continue;
        }

        purchases.forEach((p) => {
            const product = p.product as Product | undefined;

            doc.fontSize(12).fillColor("black").text(
            `• Purchase #${p.idPurchase} - Product: ${
                product?.title ?? "N/D"
            } | Format: ${product?.format ?? "N/D"} | Anno: ${
                product?.year ?? "N/D"
            } | Date: ${p.createdAt.toLocaleDateString()}`
            );

            if (p.type === "gift" && p.recipientEmail) {
                doc
                    .fontSize(11)
                    .fillColor("blue")
                    .text(`   → Gifted to: ${p.recipientEmail}`);
            }
        });

        doc.moveDown();
    }

    doc.end();
  });
};