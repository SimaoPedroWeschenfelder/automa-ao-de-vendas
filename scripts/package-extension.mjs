import {mkdir,rename,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkRelease,sourceFiles} from './check-release.mjs';
import {createZip} from './create-zip.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const temporaryDirectory=path.join(root,'.local');
await mkdir(temporaryDirectory,{recursive:true});
const archive=path.join(temporaryDirectory,'pulse-conector-'+crypto.randomUUID()+'.zip');
try{
  await writeFile(archive,createZip(await sourceFiles(path.join(root,'extension'))));
  const release=await checkRelease(root,archive);
  await rename(archive,path.join(root,'pulse-conector.zip'));
  console.log(`ZIP atualizado e comparado aos fontes: ${release.version}, ${release.files} arquivos.`);
}finally{await rm(archive,{force:true})}
