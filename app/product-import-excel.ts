import type {ImportRow} from './product-import-data';
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
const headers=['Nombre de producto','Talla','Color','Precio local','Precio por paquetería','Departamento','Categoría','Descripción'];
export async function readProductExcel(file:File){
 if(!/\.xlsx$/i.test(file.name))throw new Error('Selecciona un archivo Excel .xlsx.');if(file.size>5*1024*1024)throw new Error('El archivo debe pesar menos de 5 MB.');
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.load(await file.arrayBuffer());const sheet=book.getWorksheet('Productos')||book.worksheets[0];if(!sheet)throw new Error('El archivo no contiene una hoja de productos.');
 const map=new Map<string,number>();sheet.getRow(1).eachCell((cell,col)=>{const key=normal(cell.text);if(map.has(key))throw new Error(`La columna ${cell.text} está repetida.`);map.set(key,col)});
 const aliases=[['nombre de producto','nombre del producto','producto','nombre'],['talla'],['color'],['precio local'],['precio por paqueteria','precio paqueteria'],['departamento'],['categoria'],['descripcion']];const cols=aliases.map(a=>a.map(k=>map.get(k)).find(Boolean));if(!cols[0]||!cols[3]||!cols[4])throw new Error('Faltan las columnas Nombre de producto, Precio local o Precio por paquetería. Descarga la plantilla.');
 const rows:ImportRow[]=[];const errors:string[]=[];if(sheet.rowCount>1001)throw new Error('La hoja es demasiado grande. Usa un archivo de hasta 100 filas de productos.');
 for(let i=2;i<=sheet.rowCount;i++){const row=sheet.getRow(i);if(cols.every(c=>!c||!row.getCell(c).text.trim()))continue;if(rows.length>=100)throw new Error('Importa hasta 100 filas por archivo.');
 const values=cols.map(c=>{if(!c)return '';const cell=row.getCell(c);if(cell.type===ExcelJS.ValueType.Formula)errors.push(`Fila ${i}: sustituye las fórmulas por valores.`);return cell.value??''});
 const str=(n:number)=>typeof values[n]==='string'||typeof values[n]==='number'?String(values[n]).trim():cols[n]?row.getCell(cols[n]!).text.trim():'';
 const cents=(n:number)=>{const v=values[n];if(typeof v==='number'&&Number.isFinite(v)&&Math.abs(v*100-Math.round(v*100))<0.00001)return Math.round(v*100);const s=str(n);if(/^\d+(\.\d{1,2})?$/.test(s))return Math.round(Number(s)*100);return NaN};
 rows.push({row:i,name:str(0),size:str(1),color:str(2),localPrice:cents(3),shippingPrice:cents(4),department:str(5),category:str(6),description:str(7)});
 }
 return {rows,errors};
}
export async function productTemplate(){
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Productos');sheet.addRow(headers);sheet.addRow(['Camisa casual','M','Azul',449,499,'Ropa','Camisas','Camisa de manga corta']);sheet.addRow(['Camisa casual','G','Negro',479,529,'Ropa','Camisas','Camisa de manga corta']);sheet.addRow(['Botella reutilizable','','',289,329,'Hogar','Botellas','']);sheet.columns.forEach((c,i)=>{c.width=[30,15,18,20,26,22,22,45][i]});sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF174F43'}};sheet.views=[{state:'frozen',ySplit:1}];for(const c of [4,5])sheet.getColumn(c).numFmt='0.00';const notes=book.addWorksheet('Instrucciones');[
 'Reemplaza los ejemplos de la hoja Productos por tus datos. Máximo 100 filas por archivo.',
 'Una fila por combinación de talla y color. Deja ambos vacíos si no aplican.',
 'Repite el mismo nombre para agrupar las opciones en un producto. Hasta 20 opciones por producto.',
 'Precio local aplica a Monterrey y CDMX. Precio por paquetería aplica al producto enviado.',
 'El cargo de envío de $300 MXN se suma una sola vez al pedido, aparte del precio de producto.',
 'Precios numéricos mayores a cero, en MXN, hasta dos decimales. No uses fórmulas.',
 'Departamento, categoría y descripción son opcionales; deben coincidir para todas las filas del mismo producto.',
 'Se agregarán productos nuevos, disponibles en MTY, CDMX y paquetería. No se reemplazan productos existentes.',
 'Las fotos se agregan después desde Editar producto. Revisa la vista previa antes de confirmar.'
 ].forEach(s=>notes.addRow([s]));notes.getColumn(1).width=110;notes.eachRow(r=>{r.alignment={wrapText:true};r.height=32});const bytes=await book.xlsx.writeBuffer();return new Blob([bytes as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
