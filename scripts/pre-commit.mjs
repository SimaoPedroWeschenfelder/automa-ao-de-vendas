import {spawnSync} from 'node:child_process';
import {mkdtemp,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const directory=await mkdtemp(path.join(tmpdir(),'pulse-commit-'));
try{
  const checkout=spawnSync('git',['checkout-index','--all','--prefix='+directory+path.sep],{cwd:root,stdio:'inherit',windowsHide:true});
  if(checkout.error)throw checkout.error;
  if(checkout.status!==0)throw new Error('Não foi possível conferir os arquivos preparados para commit.');
  const check=path.join(directory,'scripts','check.mjs');
  try{await access(check)}catch{throw new Error('Inclua scripts/check.mjs e os demais arquivos do ambiente no commit pelo Source Control.')}
  console.log('Conferindo a cópia exata dos arquivos preparados para commit…');
  const result=spawnSync(process.execPath,[check],{cwd:directory,stdio:'inherit',windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)process.exitCode=result.status||1;
}catch(error){console.error('Commit bloqueado: '+error.message);process.exitCode=1}
finally{
  if(path.dirname(path.resolve(directory))!==path.resolve(tmpdir())||!path.basename(directory).startsWith('pulse-commit-'))throw new Error('Pasta temporária inesperada; limpeza interrompida.');
  await rm(directory,{recursive:true,force:true});
}
