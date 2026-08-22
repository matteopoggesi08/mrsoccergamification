import jsPDF from 'jspdf';
export type PdfSection={title:string;lines:string[]};
export function makePdf(title:string,sections:PdfSection[],file:string,meta?:{team?:string;season?:string}){
 const d=new jsPDF(); let y=20; const W=d.internal.pageSize.getWidth(); const H=d.internal.pageSize.getHeight();
 const footer=()=>{d.setFontSize(8);d.setTextColor(115,135,155);d.text('SOCCERMRGAMIFICATION',15,H-10);d.text(`Pagina ${d.getNumberOfPages()}`,W-35,H-10)};
 const newPage=()=>{footer();d.addPage();y=20};
 d.setFillColor(7,19,32);d.rect(0,0,W,32,'F');d.setTextColor(108,231,255);d.setFont('helvetica','bold');d.setFontSize(18);d.text(title,15,18);
 d.setTextColor(150,170,188);d.setFont('helvetica','normal');d.setFontSize(8);d.text(`${meta?.team||''}${meta?.season?' · '+meta.season:''}`,15,26);y=43;
 for(const s of sections){if(y>H-35)newPage();d.setTextColor(28,66,92);d.setFont('helvetica','bold');d.setFontSize(12);d.text(s.title,15,y);y+=7;d.setTextColor(55,70,82);d.setFont('helvetica','normal');d.setFontSize(9);
   for(const line of s.lines){const parts=d.splitTextToSize(String(line),180);for(const p of parts){if(y>H-25)newPage();d.text(p,15,y);y+=5}y+=1}
   y+=5;
 }
 footer();d.save(file);
}
