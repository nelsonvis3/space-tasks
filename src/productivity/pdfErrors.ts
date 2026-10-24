export function pdfError(cause:unknown){const name=cause&&typeof cause==='object'&&'name'in cause?String(cause.name):''
 if(name==='PasswordException')return 'This PDF needs the correct password. Enter it to unlock the document.'
 if(name==='InvalidPDFException')return 'This PDF is damaged or uses an unsupported format. Try exporting a new PDF from its original application.'
 if(name==='MissingPDFException')return 'PDF not found.'
 return 'The PDF reader could not load. Check your connection or download the original file.'
}
