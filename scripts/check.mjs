import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkRelease} from './check-release.mjs';
export const testFiles=['inventory.test.js','ui-state.test.js','demo.test.js','facebook.test.js','bridge-client.test.js','extension/tests/model.test.js','extension/tests/task-manager.test.js','extension/tests/bridge-policy.test.js','extension/tests/panel-bridge.test.js','scripts/check-release.test.mjs','scripts/create-zip.test.mjs','scripts/build-site.test.mjs'];
const root=fileURLToPath(new URL('../',import.meta.url));
try{
  const release=await checkRelease(root);
  console.log(`Painel, extension/ e ZIP conferidos: conector ${release.version}, ${release.files} arquivos.`);
  const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...testFiles],{cwd:root,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
  console.log('\nValidação automática concluída. O teste do formulário real é uma etapa manual antes de publicar.');
}catch(error){console.error('Validação interrompida: '+error.message);process.exitCode=1}
