import PDFDocument from "pdfkit";
import { IPurchaseListAttributes } from "../repositories/purchaseRepository";
import { PurchaseType } from "../enums/PurchaseType";
import AuthService from "../services/authService";
import { IUserAttributes } from "../models/appUser";

interface IGroupedPurchases {
    standard: IPurchaseListAttributes[];
    gift: IPurchaseListAttributes[];
    additional_download: IPurchaseListAttributes[];
}

const COLORS = {
    title: "#0D47A1",          
    headerBg: "#E3F2FD",      
    headerLine: "#90CAF9",    
    zebra: "#F7F9FC",          
    rowLine: "#E0E0E0",        
    text: "#111111",
    subtle: "#666666",
};

const SIZES = {
    pageMargin: 40,
    titleFont: 22,
    sectionFont: 17,
    headerFont: 12,
    rowFont: 11,
    headH: 34,                 
    minRowH: 28,              
    cellPadX: 6,
    cellPadY: 7,
};


type Row = string[];

const toStr = (v: unknown) =>
    v === null || v === undefined ? "" : String(v);

const clamp = (n: number, min = 1) =>
    Number.isFinite(n) && n >= min ? n : min;

const humanType = (t: PurchaseType | string) => {
    switch (t) {
        case PurchaseType.STANDARD:
        case "standard":
        return "Standard";
        case PurchaseType.GIFT:
        case "gift":
        return "Gift";
        case PurchaseType.ADDITIONAL_DOWNLOAD:
        case "additional_download":
        return "Extra download";
        default:
        return toStr(t);
    }
};

const recipientName = (p: IPurchaseListAttributes) => {
    if (p.type !== PurchaseType.GIFT || !p.recipient) return "";
    return [p.recipient.firstName, p.recipient.lastName].filter(Boolean).join(" ").trim();
};

const recipientEmail = (p: IPurchaseListAttributes) => {
    if (p.type !== PurchaseType.GIFT || !p.recipient?.email) return "";
    return p.recipient.email;
};


const drawTable = (opts: {
    doc: PDFKit.PDFDocument;
    x: number;
    y: number;
    colWidths: number[];
    headers: string[];
    rows: Row[];
    headH?: number;
    minRowH?: number; 
    zebra?: boolean;
}) => {
    const {
        doc,
        x,
        y,
        colWidths,
        headers,
        rows,
        headH = SIZES.headH,
        minRowH = SIZES.minRowH,
        zebra = true,
    } = opts;

    let cursorY = clamp(y, doc.page.margins.top);
    const pageBottom = clamp(doc.page.height) - clamp(doc.page.margins.bottom);
    const totalW = colWidths.reduce((a, b) => a + b, 0);


    const drawHeader = () => {
        
        doc.save();
        doc.rect(x, cursorY, totalW, headH).fill(COLORS.headerBg);
        doc.restore();

        
        doc.font("Helvetica").fontSize(SIZES.headerFont).fillColor(COLORS.text);

        let cx = x;
        headers.forEach((h, i) => {
            const w = clamp(colWidths[i] - SIZES.cellPadX * 2, 8);
            doc.text(h, cx + SIZES.cellPadX, cursorY + SIZES.cellPadY, {
                width: w,
                align: "left",
            });
            cx += colWidths[i];
        });

        doc
        .moveTo(x, cursorY + headH)
        .lineTo(x + totalW, cursorY + headH)
        .strokeColor(COLORS.headerLine)
        .lineWidth(0.8)
        .stroke();

        cursorY += headH;
    };

    const needSpace = (needed: number) => {
        if (cursorY + needed > pageBottom) {
            doc.addPage();
            cursorY = doc.page.margins.top;
            drawHeader();
        }
    };

    drawHeader();

    rows.forEach((row, idx) => {
        const cellHeights = row.map((val, i) => {
            const w = clamp(colWidths[i] - SIZES.cellPadX * 2, 8);
            doc.font("Helvetica").fontSize(SIZES.rowFont);
            const textHeight = doc.heightOfString(toStr(val), { width: w, align: "left" });
            return Math.ceil(textHeight) + SIZES.cellPadY * 2;
        });
        const rowH = Math.max(minRowH, ...cellHeights);

        needSpace(rowH);

        if (zebra && idx % 2 === 0) {
            doc.save();
            doc.rect(x, cursorY, totalW, rowH).fill(COLORS.zebra);
            doc.restore();
        }

        doc.font("Helvetica").fontSize(SIZES.rowFont).fillColor(COLORS.text);

        let cx = x;
        row.forEach((val, i) => {
            const w = clamp(colWidths[i] - SIZES.cellPadX * 2, 8);
            doc.text(toStr(val), cx + SIZES.cellPadX, cursorY + SIZES.cellPadY - 2, {
                width: w,
                align: "left",
            });
            cx += colWidths[i];
        });

        doc
        .moveTo(x, cursorY + rowH)
        .lineTo(x + totalW, cursorY + rowH)
        .strokeColor(COLORS.rowLine)
        .lineWidth(0.5)
        .stroke();

        cursorY += rowH;
    });

    return cursorY;
};

export const generatePDF = (userId: number, grouped: IGroupedPurchases) => {
    return new Promise<Buffer>(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: SIZES.pageMargin });
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const buyer = await AuthService.getUserById(userId);

    //Title
    doc
      .fillColor("#B71C1C")
      .fontSize(SIZES.titleFont + 4)
      .font("Helvetica-Bold")
      .text(`Purchase history for ${buyer.firstName} ${buyer.lastName}`, { align: "center" });
    doc.moveDown(1);

   // Reset to normal text style
    doc.font("Helvetica");

    const contentW =
      clamp(doc.page.width) - clamp(doc.page.margins.left) - clamp(doc.page.margins.right);
    const startX = doc.page.margins.left;

    const base = [85, 85, 210, 110, 60, 60, 70, 140, 190];
    const baseSum = base.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, contentW / baseSum);
    const colWidths = base.map((w) => clamp(Math.floor(w * scale), 40));

    const headers = [
      "Type",
      "Product ID",
      "Title",
      "Product Type",
      "Year",
      "Cost",
      "Format",
      "Recipient name",
      "Recipient email",
    ];

    const section = (label: string, data: IPurchaseListAttributes[]) => {
        doc.x = startX;
        doc
            .fillColor(COLORS.title)
            .fontSize(SIZES.sectionFont)
            .text(label, startX, doc.y, { underline: true, align: "left" });
        doc.moveDown(0.5);

        if (!data || data.length === 0) {
            doc.x = startX;
            doc.fontSize(SIZES.rowFont).fillColor(COLORS.subtle).text("No records.", startX, doc.y);
            doc.moveDown();
            return;
        }

        const rows: Row[] = data.map((p) => [
            humanType(p.type),
            toStr(p.product?.idProduct),
            toStr(p.product?.title),
            toStr(p.product?.type),
            toStr(p.product?.year),
            toStr(p.product?.cost),
            toStr(p.product?.format),
            recipientName(p),
            recipientEmail(p),
        ]);

        const newY = drawTable({
            doc,
            x: startX,
            y: doc.y,
            colWidths,
            headers,
            rows,
            headH: SIZES.headH,
            minRowH: SIZES.minRowH,
        });

        doc.y = newY + 14; 
    };

    section("Original downloads", grouped.standard);
    section("Gifts", grouped.gift);
    section("Extra downloads", grouped.additional_download);

    doc.end();
  });
};