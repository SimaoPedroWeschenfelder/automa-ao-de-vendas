import {deflateRawSync} from 'node:zlib';
const crcTable=Uint32Array.from({length:256},(_,value)=>{
  for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;
  return value>>>0;
});
function crc32(bytes){let result=0xffffffff;for(const byte of bytes)result=crcTable[(result^byte)&255]^(result>>>8);return (result^0xffffffff)>>>0}

// ZIP normal, sem ZIP64. Ordem e data fixas evitam alterar o pacote sem mudar fontes.
export function createZip(files){
  if(files.size>65535)throw new Error('O pacote excede o limite de arquivos.');
  const bodies=[],directory=[];let position=0;
  for(const [name,bytes] of [...files].sort(([a],[b])=>a<b?-1:a>b?1:0)){
    if(!name||name.startsWith('/')||name.includes('\\')||name.split('/').includes('..'))throw new Error('Nome de arquivo inválido: '+name);
    const encoded=Buffer.from(name,'utf8'),compressed=deflateRawSync(bytes),crc=crc32(bytes);
    if(encoded.length>65535||bytes.length>0xffffffff||compressed.length>0xffffffff)throw new Error('Arquivo excede o limite do ZIP.');
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(0x21,12);
    local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(encoded.length,26);
    bodies.push(local,encoded,compressed);
    const central=Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(0x21,14);
    central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(encoded.length,28);central.writeUInt32LE(position,42);
    directory.push(central,encoded);position+=local.length+encoded.length+compressed.length;
  }
  const central=Buffer.concat(directory),end=Buffer.alloc(22);
  if(position+central.length>0xffffffff)throw new Error('Pacote excede o limite do ZIP.');
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.size,8);end.writeUInt16LE(files.size,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(position,16);
  return Buffer.concat([...bodies,central,end]);
}
