import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
// Original, redistributable fixture. Valid cross-reference offsets are bytes.
const directory=resolve('e2e/fixtures');mkdirSync(directory,{recursive:true})
const content='BT /F1 18 Tf 50 740 Td (Study for 25 minutes. Review 3 topics.) Tj 0 -30 Td (Original notes stay intact.) Tj ET'
const second='BT /F1 18 Tf 50 740 Td (Second page. Take a short break.) Tj ET'
const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>',`<< /Length ${Buffer.byteLength(second)} >>\nstream\n${second}\nendstream`]
let pdf='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
writeFileSync(resolve(directory,'notes.pdf'),pdf)
