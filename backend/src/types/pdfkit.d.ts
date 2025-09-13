declare module 'pdfkit' {
    import { Readable } from 'stream';
    class PDFDocument extends Readable {
        constructor(options?: any);
        fontSize(size: number): this;
        fillColor(color: string): this;
        strokeColor(color: string): this;
        lineWidth(width: number): this;
        // Overloads
        text(text: string, options?: any): this;
        text(text: string, x: number, y?: number, options?: any): this;
        moveDown(lines?: number): this;
        rect(x: number, y: number, w: number, h: number): this;
        roundedRect(x: number, y: number, w: number, h: number, r: number): this;
        fill(color?: string): this;
        stroke(color?: string): this;
        addPage(options?: any): this;
        moveTo(x: number, y: number): this;
        lineTo(x: number, y: number): this;
        end(): void;
        page: { width: number; height: number; margins: { bottom: number } };
        y: number;
        x: number;
        save(): this;
        restore(): this;
    }
    export default PDFDocument;
}
