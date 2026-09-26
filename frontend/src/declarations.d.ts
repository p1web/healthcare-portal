declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
      [key: string]: any;
    };
    addImage(
      imageData: string | HTMLCanvasElement | HTMLImageElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: any,
      rotation?: number
    ): any;
    save(filename?: string): void;
    [key: string]: any;
  }
  const jsPDFDefault: any;
  export default jsPDFDefault;
}
